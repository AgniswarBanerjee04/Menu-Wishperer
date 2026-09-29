import urllib.request
import urllib.parse
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_pipeline():
    # 1. Login
    login_data = json.dumps({'email': 'demo@menuwhisperer.com', 'password': 'Password123!'}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    token = json.loads(res.read())['access_token']
    print("[1] Logged in successfully. JWT Token acquired.")

    # 2. Extract Indian & Tabular menu with multi-column variants and currency cleansing
    menu_text = """Golden Dragon & Royal Dawat
ITEMS | VEG | CHICKEN | MIXED
Brown Garlic Noodles | 140 | 160 | -
Hakka Noodles | 120 | 150 | 180
Egg Fried Rice Rs. 145/-
Murgh Malai Tikka 420/-
Paneer Butter Masala 340/-
Dal Makhani (Half 180 / Full 280)
Butter Garlic Naan 85/-"""

    extract_data = urllib.parse.urlencode({'text': menu_text, 'restaurant_name': 'Golden Dragon & Royal Dawat'}).encode('utf-8')
    req2 = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/menus/extract',
        data=extract_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': f'Bearer {token}'}
    )
    res2 = urllib.request.urlopen(req2)
    extracted = json.loads(res2.read())
    print(f"[2] Extracted Restaurant: {extracted.get('restaurant_name')}")
    print(f"    Dishes extracted: {len(extracted['dishes'])}")
    for d in extracted['dishes']:
        print(f"      • [{d.get('id', 'N/A')}] {d['name']} | ₹{d['price']} | Dietary: {d.get('dietary')} | Spice: {d.get('spice_level')} | Cat: {d.get('category')}")

    # 3. Request Recommendations with Dynamic Preferences (Vegetarian + Comfort Mood + Budget ₹500)
    rec_payload = json.dumps({
        'session_id': extracted['session_id'],
        'mood': 'comfort',
        'budget': 500,
        'hunger_level': 'hungry',
        'dishes': extracted['dishes']
    }).encode('utf-8')
    req3 = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/menus/recommend',
        data=rec_payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    res3 = urllib.request.urlopen(req3)
    rec = json.loads(res3.read())
    print("\n[3] AI Dynamic Recommendations:")
    for r in rec['recommendations']:
        print(f"      ★ {r['dish_name']} (₹{r['price']}) - Score: {r['match_score']}% - Dietary: {r.get('dietary')} - Spice: {r.get('spice_level')}")
        print(f"        Reasoning: {r['reasoning']}")
        if r.get('warnings'):
            print(f"        Warning: {r['warnings']}")
    print(f"\n    Allergy Disclaimer: {rec['disclaimer']}")

if __name__ == '__main__':
    test_pipeline()
