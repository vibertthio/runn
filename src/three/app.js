// import box from './box/';
//
// box();

import particles from './particles/';

particles();

if (module.hot) {
  module.hot.accept(() => {
    window.location.reload(true);
  });
}
