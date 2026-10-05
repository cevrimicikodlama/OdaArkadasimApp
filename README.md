# Welcome to your Expo app 👋

## Roommate app setup

The mobile app uses the Express API in `server/` and the MySQL schema in `server/schema.sql`.

1. Install MySQL 8 or newer and run `server/schema.sql` in MySQL Workbench (or with a MySQL client) using an administrator account. Then create a least-privilege API user:

   ```sql
   CREATE USER 'oda_app'@'localhost' IDENTIFIED BY 'choose-a-unique-password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON oda_arkadasim.* TO 'oda_app'@'localhost';
   ```

   Use the same username and password in `.env`.
2. Copy `.env.example` to `.env`. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and a unique random `JWT_SECRET` of at least 32 characters.
3. For an Android emulator, `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api` works as configured in the example. For a physical Android phone, replace `10.0.2.2` with the development computer's LAN IPv4 address and allow port 4000 through its firewall. Add the Expo web origin to `CORS_ORIGINS` if using web.
4. Start the API with `npm run api` and the app with `npm start -- --lan` in separate terminals. Check the database connection at `http://localhost:4000/api/health`.

Passwords are hashed with bcrypt on the API; the app stores the JWT in Android SecureStore. Never commit `.env` or expose database credentials in the mobile app.

Run `npm run lint` and `npx tsc --noEmit` to validate the project.

## Expo starter documentation

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
