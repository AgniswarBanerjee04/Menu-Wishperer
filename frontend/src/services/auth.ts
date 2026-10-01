export * from '../api/auth';
export {
  authApi as default,
  registerUser,
  loginUser,
  mockGetMe,
  mockUpdateMe,
  DEMO_USER,
  initMockStorage,
  DEFAULT_DEMO_USERS,
} from '../api/auth';

// Seed mock storage if not already initialized
if (typeof localStorage !== 'undefined') {
  const defaultUsers = [
    { email: "demo@menuwhisperer.com", password: "Password123!", name: "Epicure Demo" }
  ];
  if (!localStorage.getItem("mock_users")) {
    localStorage.setItem("mock_users", JSON.stringify(defaultUsers));
  }
}
