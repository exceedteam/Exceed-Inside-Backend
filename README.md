# RestAPI For Exceed-Inside-Frontend
Built with [Express](https://expressjs.com/), [MongooseJS](https://mongoosejs.com/) and [Socket IO](https://socket.io/) 

## Quick Start
####1. Clone this project or Download that ZIP file

```shell script
$ git clone https://github.com/exceedteam/Exceed-Inside-Backend.git `project-directory`
```

####2.  Make sure you have [npm](https://www.npmjs.org/) installed globally

More details here
https://nodejs.org/en/download/

#### 3. On the command prompt run the following commands

```shell script
$ cd `project-directory`
$ git checkout dev
$ cp .env.example .env
$ npm install
```

##### Development mode
```shell script
$ npm run dev
```

##### Production
```shell script
$ npm run build
$ npm start
```

#### Example login request

```bash
curl --location --request POST "http://localhost:5000/api/login" \
  --header "Content-Type: application/json" \
  --header "X-Requested-With: XMLHttpRequest" \
  --data "{
	\"email\": \"admin@mail.com\",
	\"password\": \"password123\"
}"
```

#### Example login response

```json
{
  "token":"eyJhbGciOiJIUzI1NiSFDVs[dfcCI6IkpXVCJ9.eyJcksdnKJNDKHClkDCjDcnddcwOGRiYjNjN2Q1NzYzZWE5NiIsImFkbWluIjp0cnVlLCJpYXQiOjE1OTIzMTY3MzQsImV4cCI6MTU5MjkyMTUzNH0.7hTaXWPzCGhXMEOPTNSJvGVWPbPOWx_ImOAu6CosgP8"
}
```

#### Example authorized request with token

```bash
curl --location --request GET "http://localhost:5000/api/users" \
  --header "Authorization: eyJhbGciOiJIUzI1NiSFDVs[dfcCI6IkpXVCJ9.eyJcksdnKJNDKHClkDCjDcnddcwOGRiYjNjN2Q1NzYzZWE5NiIsImFkbWluIjp0cnVlLCJpYXQiOjE1OTIzMTY3MzQsImV4cCI6MTU5MjkyMTUzNH0.7hTaXWPzCGhXMEOPTNSJvGVWPbPOWx_ImOAu6CosgP8" \
  --header "Content-Type: application/json" \
  --header "X-Requested-With: XMLHttpRequest" \
  --data ""
```
