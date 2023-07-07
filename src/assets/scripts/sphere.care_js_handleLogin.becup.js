const handleLogin = async () => {
  const fullpagePopupAnimationDuration = 250
  const loginFormPopupAnimationDuration = fullpagePopupAnimationDuration
  const loadingTextPlaceholderAnimationDuration = fullpagePopupAnimationDuration

  Promise.all([
    new Promise(resolve => {
      window.addEventListener('requiredDelayTimeIsUp', _ => resolve(), { once: true })
    }),
    new Promise((resolve, reject) => {
      window.addEventListener('loggedInFromBrowserMemory', _ => resolve(), { once: true })
      window.addEventListener('loggedInFromInput', _ => resolve(), { once: true })
    })
  ]).then(() => removeFullpagePopup())

  const requiredLoadingMinDelayMilliseconds = 250
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('requiredDelayTimeIsUp'))
  }, requiredLoadingMinDelayMilliseconds)

  const removeFullpagePopup = () => {
    // animate popup dissapearing
    fullpagePopup.style.transitionDuration = `${fullpagePopupAnimationDuration}ms`
    fullpagePopup.style.transitionTimingFunction = 'ease-out'
    fullpagePopup.style.visibility = 'hidden'
    fullpagePopup.style.opacity = 0

    setTimeout(() => {
      // remove fullpage popup from dom after animation ends
      fullpagePopup.parentNode.removeChild(fullpagePopup)
      document.body.style.overflow = 'auto'
    }, fullpagePopupAnimationDuration)
  }

  const showLoginFormPopup = () => {
    const loginFormPopup = document.querySelector('.js-login-form-popup')
    loginFormPopup.style.transitionDuration = `${loginFormPopupAnimationDuration}ms`
    loginFormPopup.style.transitionTimingFunction = 'ease-in'
    loginFormPopup.style.visibility = 'visible'
    loginFormPopup.style.opacity = 1
  }

  const fullpagePopup = document.querySelector('.js-login-fullpage-popup'),
        loginForm = fullpagePopup.querySelector('.js-login-form'),
        passwordInput = loginForm.querySelector('.js-login-form input.js-password-input')

  const requestUrl = window['serverlessFunctionUrl']
  const logIn = async (username, password) => {
    return axios.post(requestUrl, {
      isLoginRequest: true,
      login: username,
      password: password
    }, {
      headers: {
        'content-type': 'text/plain'
      }
    })
  }

  const username = document.querySelector('input[name="place"]').value
  const password = localStorage.getItem('password')

  const loginResponse = await logIn(username, password)
  if (loginResponse.data.result === 'error') {
    // user is not logged in
    const loadingTextPlaceholder = document.querySelector('.js-loading-text-placeholder')
    loadingTextPlaceholder.style.visibility = 'hidden'
    loadingTextPlaceholder.style.opacity = 0
    loadingTextPlaceholder.style.transitionDuration = `${loadingTextPlaceholderAnimationDuration}ms`

    // loading text dissapears -> show login popup
    const delay = 250 // add delay, so popup will animate not immediately, but after some amount of milliseconds
    setTimeout(() => showLoginFormPopup(), loadingTextPlaceholderAnimationDuration + delay)
  }
  if (loginResponse.data.result === 'success') {
    // user is logged in
    window.dispatchEvent(new CustomEvent('loggedInFromBrowserMemory'))
  }

  // login form error message handling
  const loginFormErrorMessage = loginForm.querySelector('.js-login-request-status-hint')
  const loginFormErrorMessageAnimationTransitionDurationMs = 250
  const timeErrorMessageIsVisibleMs = 5000

  const showLoginFormErrorMessage = () => {
    loginFormErrorMessage.style.transitionDuration = `${loginFormErrorMessageAnimationTransitionDurationMs}ms`
    loginFormErrorMessage.style.visibility = 'visible'
    loginFormErrorMessage.style.opacity = '1'

    setLoginFormErrorMessageHidingTimer()
  }

  const setLoginFormErrorMessageHidingTimer = debounce(() => {
    // hide login form error message after some delay
    loginFormErrorMessage.style.transitionDuration = `${loginFormErrorMessageAnimationTransitionDurationMs}ms`
    loginFormErrorMessage.style.visibility = 'hidden'
    loginFormErrorMessage.style.opacity = '0'
  }, timeErrorMessageIsVisibleMs)

  loginForm.onsubmit = async (e) => {
    e.preventDefault()
    console.log('form submitted')

    const password = passwordInput.value
    if (password.trim().length === 0) {
      // empty password
      console.warn('empty password')
      return
    }

    const loginResponse = await logIn(username, password)
    const { result, message } = loginResponse.data
    if (result === 'error') {
      console.warn(message)

      showLoginFormErrorMessage()
      return
    }

    if (result === 'success') {
      // save password in user's browser
      // remove popup
      console.log(message)

      localStorage.setItem('password', password)
      window.dispatchEvent(new CustomEvent('loggedInFromInput'))
    }
  }
}

handleLogin()
