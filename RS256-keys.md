
# RSA Key Pair Generation

At the Git shell run:
1.  *ssh-keygen -t rsa -b 2048 -m PEM -f jwtRS256.key*  
Don't add a passphrase

2.  *openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub*

This will create the files **jwtRS256.key**, and **jwtRS256.key.pub** in working directory.

## Storing keys

### Option 1.
Enter the keys in **.env**:  
Copy all content of file **jwtRS256.key**.  
Paste it in **.env**, after JWENKY_PRIVATE_KEY=, between double quotes.  
Replace the line-end character(s) with literal '\n'.  
Repeat for **jwtRS256.key.pub** at JWENKY_PUBLIC_KEY=.  
The **.env.example** contains sample functional keys.  

This option is faster, and more secure.  
Securing **.env** file is trivial for hosters.  
It is faster, because **.env** content is cached.  

### Option 2.
The server may read the keys directly from the files **jwtRS256.key**,  
and **jwtRS256.key.pub**, or other filenames that the developer may apply.  
Move the files in a secure place on the server, not accessible by web users.  
Apply proper access rights on the files.  

The Option 2 needs a little code editing by the developer.  
In all places where the keys are read, I've added the code, in comments,  
so that the application can read them from the files.  
The developer must uncomment the lines which read the key-files,   
and those which require the *fs* module,  
and comment out the lines which get the **.env** values.  
All these lines are in **/routes/auth.js** for private key,  
and in **/services/auth/AccessMiddle.js** for public key.  
