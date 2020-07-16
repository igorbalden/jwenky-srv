# JWENKY-SRV

Boilerplate Express API server with user authentication.  
Uses MySql, and Jwt, with RSA keys, fingerprinted.

## Features
1.  Password forgot, reset  
2.  Throttling  
3.  XSRF safe.

### MySql
Create a new database and import **enky_jwt.sql** in it.

### Usage
1.  Clone the repo locally.  
2.  Run `npm install`.  
3.  Copy **.env.example** to **.env**  
    Edit Mysql section in **.env** properly.  

```sh
# Start application locally
$ npm run dev
```

## Client
There is a client application at https://github.com/igorbalden/jwenky-cnt.  
It's a React Spa built for this Api server.  
Clone, and start the client application, and  
go to */auth/signUp* page to create the first user.  
This user will be an admin.  

## RSA Keys
Check [RS256-keys.md](./RS256-keys.md) in current directory.

## SERVERS
Without any other change, an all around Api server will run on port 5050.  
This is a viable option. More instances of the server may be added,  
when the load is elevated.  
  
The best use scenario is different.  
There should be two server types made by this server.  
Authentication server, and Access server.  
An installation should include one (may be more) Auth server,  
and many Access servers, as needed, running as microservices.  

### Auth server  
The Auth server needs only **/routes/auth.js**, and **/routes/password.js**, for routing.  
These files include all the endpoints Auth server needs to serve.  
The middleware that these routes need is included in **/services/auth/AuthMiddle.js**.  

### Access servers  
Access servers do not need to include **/routes/auth.js**,  
**/routes/password.js**, and **/services/auth/AuthMiddle.js**.  
The **.env** file should not include the **JWENKY_PRIVATE_KEY** value.  
If the private key is read from a key file, this file   
should only exist on the Auth server.

### Https  
The authentication system uses both Jwt, and cookies.  
If https is available, the cookies can be secure ones.  
It only requires to uncomment three existing lines in **/routes/auth.js**,  
with content 'secure: true', to make cookies use https protocol.  

## Configuration  
### Email
Uses [Nodemailer](https://github.com/nodemailer/nodemailer).  
In **/config/mail.js** there are two configured example mailers.  
1.  The 'local' one will work with [Mailhog](https://github.com/mailhog/MailHog) SMTP testing server.
2.  The 'production' mailer uses a common linux server configuration.  

There configurations can be modified, and other configurations can be added as needed.

### Auth  Parameters  
In **/config/auth.js**  

Default configuration:  
Access token valid for 10 minutes, refresh token valid for 20 hours.
