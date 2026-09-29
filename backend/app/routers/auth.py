from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserUpdate,
    TokenResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserOut
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    stmt = select(User).where(User.email == payload.email.lower())
    existing = await db.scalar(stmt)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    new_user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        mobile_number=payload.mobile_number
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    refresh_token = create_refresh_token({"sub": str(new_user.id)})
    
    user_out = UserOut(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        mobile_number=new_user.mobile_number,
        is_active=new_user.is_active,
        has_preferences=False,
        created_at=new_user.created_at
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_out
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email.lower()).options(selectinload(User.preferences))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
        
    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    user_out = UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        mobile_number=user.mobile_number,
        is_active=user.is_active,
        has_preferences=bool(user.preferences),
        created_at=user.created_at
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_out
    )

@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token_endpoint(payload: TokenRefreshRequest, db: AsyncSession = Depends(get_db)):
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = decoded.get("sub")
    stmt = select(User).where(User.id == int(user_id))
    user = await db.scalar(stmt)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    new_access_token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenRefreshResponse(access_token=new_access_token, token_type="bearer")

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        mobile_number=current_user.mobile_number,
        is_active=current_user.is_active,
        has_preferences=bool(current_user.preferences),
        created_at=current_user.created_at
    )

@router.put("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.email and payload.email.lower() != current_user.email.lower():
        # verify email uniqueness
        stmt = select(User).where(User.email == payload.email.lower(), User.id != current_user.id)
        existing = await db.scalar(stmt)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists"
            )
        current_user.email = payload.email.lower()
    
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip() or None
    
    if payload.mobile_number is not None:
        current_user.mobile_number = payload.mobile_number.strip() or None
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        mobile_number=current_user.mobile_number,
        is_active=current_user.is_active,
        has_preferences=bool(current_user.preferences),
        created_at=current_user.created_at
    )
