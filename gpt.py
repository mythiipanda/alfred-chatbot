import openai
openai.api_key = "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"
prompt = "Translate the following English text to French: 'Hello, how are you?'"

client = openai.OpenAI()

def get_completion(prompt, model="gpt-3.5-turbo"):
    messages = [{"role": "user", "content": prompt}]
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0
    )
    return response.choices[0].message.content

response = get_completion(prompt)
print(response)
google_api = "AIzaSyBSRObssXmZxfs5fu3ISM1H0yyJTIONZ-Q"