import requests
import os
url = "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBQV-fKsLZhUkasadWTXsFdQyJ5X23Wojw"
response = requests.get(url)
data = response.json()
with open('models_list.txt', 'w') as f:
    for model in data.get('models', []):
        f.write(model['name'] + '\n')
