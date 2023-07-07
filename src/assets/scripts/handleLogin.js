import { debounce } from './_helpers.js'

const handleLogin = async () => {
  const loginScreenAnimationDuration = 250
  const loginPopupAnimationDuration = loginScreenAnimationDuration
  const loadingPlaceholderAnimationDuration = loginScreenAnimationDuration
  
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
    loginScreen.style.transitionDuration = `${loginScreenAnimationDuration}ms`
    loginScreen.style.transitionTimingFunction = 'ease-out'
    loginScreen.style.visibility = 'hidden'
    loginScreen.style.opacity = 0
    
    setTimeout(() => {
      // remove login screen from dom after animation ends
      loginScreen.parentNode.removeChild(loginScreen)
      document.body.style.overflow = 'auto'
    }, loginScreenAnimationDuration)
  }
  
  const showLoginPopup = () => {
    const loginPopup = document.querySelector('#login-popup')
    loginPopup.style.transitionDuration = `${loginPopupAnimationDuration}ms`
    loginPopup.style.transitionTimingFunction = 'ease-in'
    loginPopup.style.visibility = 'visible'
    loginPopup.style.opacity = 1
  }
  
  const loginScreen = document.querySelector('#login-screen')
  const loginForm = document.querySelector('#login-form')
  
  // const requestUrl = window['serverlessFunctionUrl']
  const requestUrl = 'http://localhost:8092/'
  const logIn = async (username, password) => {
    return fetch(requestUrl, {
      method: 'POST',
      body: JSON.stringify({
        login: username,
        password: password
      })
    })
  }
  
  const username = localStorage.getItem('login')
  const password = localStorage.getItem('password')
  
  if (username && password) {
    const loginResponse = await logIn(username, password)
    
    if (loginResponse.ok) {
      const baseId = await loginResponse.text()
      window.dispatchEvent(new CustomEvent('loggedInFromBrowserMemory'))
      
      console.log(51)
      return
    }
  }
  
  // user is not logged in
  // animate login popup appearing
  (() => {
    const loadingPlaceholder = document.querySelector('#loading-placeholder')
    loadingPlaceholder.style.visibility = 'hidden'
    loadingPlaceholder.style.opacity = 0
    loadingPlaceholder.style.transitionDuration = `${loadingPlaceholderAnimationDuration}ms`
  
    // loading text dissapears -> show login popup
    const delay = 250 // add delay, so popup will animate not immediately, but after some amount of milliseconds
    setTimeout(() => showLoginPopup(), loadingPlaceholderAnimationDuration + delay)
  })()
  
  // login form error message handling
  const loginFormErrorMessage = loginForm.querySelector('#error-message')
  const loginFormErrorMessageAnimationTransitionDurationMs = 250
  const timeErrorMessageIsVisibleMs = 5000
  
  const showErrorMessage = () => {
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
  
  // const loginForm = document.querySelector('.js-login-form');
  const usernameInput = loginForm.querySelector('.js-login-input');
  const passwordInput = loginForm.querySelector('.js-password-input')
  
  loginForm.onsubmit = async (e) => {
    e.preventDefault()
    console.log('form submitted')
    
    const username = usernameInput.value
    const password = passwordInput.value
    if (password.trim().length === 0) {
      // empty password
      console.warn('empty password')
      return
    }
    
    const loginResponse = await logIn(username, password)
    if (loginResponse.ok) {
      const baseId = await loginResponse.text()
      
      localStorage.setItem('login', username)
      localStorage.setItem('password', password)
      
      window.dispatchEvent(new CustomEvent('loggedInFromInput'))
      return
    } else {
      showErrorMessage()
    }
  }
}

handleLogin()
