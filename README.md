"scripts": {
// "dev": "nodemon --watch src --exec ts-node src/index.ts", // incase your index file is index.ts
"dev": "nodemon", // incase your index file is app.ts
"build": "tsc"
},

Consistency:

Be consistent in your naming conventions across your application. If you're using camelCase (authToken) elsewhere in your codebase, stick with that.
If you prefer snake_case (auth_token), you can use that too. The key is to be consistent, whether you're naming headers, cookies, or any other data fields. 2. Industry Norms:
Using auth_token (snake_case) is a bit more common for things like cookies and environment variables because they often use underscores to separate words.
authToken (camelCase) is more common in JavaScript and frontend code, as variables and function names are usually written in camelCase. 3. Security Considerations:
Name Obfuscation: Sometimes, people use non-obvious names for cookies (e.g., \_authTkn) for security purposes, so the token name isn't easily guessable by attackers.
Sensitive Data: If the token is sensitive, make sure you set the following flags for security:
HttpOnly: Prevents JavaScript from accessing the token.
Secure: Ensures the token is only sent over HTTPS.
SameSite: Prevents the cookie from being sent with cross-site requests, which can help mitigate CSRF attacks. 4. Back-End Configuration:
Ensure that whatever name you choose (authToken or auth_token), it's consistent across:

The backend where you're setting the cookie.
The frontend where you're retrieving or sending the cookie.
Any middleware or third-party services that might rely on the cookie's name.

<!-- to host frontend and backend in the same server, usefull for small projects, bundled static files can be hosted in the backend -->

"scripts": {
"dev": "nodemon",
"build": "npm install && npx tsc",
"build": "npm install && npx tsc", 
"start": "node ./dist/app.js"
},
#   s e a f o o d - n o d e - a p i  
 