import requests

response = requests.post("http://127.0.0.1:5000/recommend", json={"song": "For The First Time"})
print(response.status_code)
print(response.json())
