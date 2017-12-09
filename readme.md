# THREE.js Boilerplate
A simple THREE.js template that includes module bundling, ES6, BrowserSync, and a watered down version of Hot Module Replacement (updates are injected without a page refresh, but state is not maintained). The intention of this repo is to expedite THREE.js development by automating time consuming tasks such as page refreshing and boilerplate setup.

### Features:
* Module Bundling
* ES6 Compilation
* BrowserSync
* Hot Module Replacement (HMR)
* ESLint
* THREE Orbit Controls (Inspect and navigate scene via click and drag)


BrowserSync is included for two reasons:
1. So our HTML file is refreshed automatically when a change is made
2. So our THREE.js scene can be tested locally on a mobile device


## Getting started
**Install dependencies:**
`yarn` or `npm install`

**Start webpack-dev-server:**
`npm start`


Your THREE.js scene should now be viewable at http://localhost:3001.

## License

MIT, see [LICENSE.md](https://github.com/christopher4lis/three-boilerplate/blob/master/LICENSE.md) for details.
