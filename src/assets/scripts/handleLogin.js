import { debounce } from './_helpers.js'
import { loginApiEndpoint } from './_apiEndpoints.js'

const loginScreenAnimationDuration = 250
const loginPopupAnimationDuration = loginScreenAnimationDuration
const loadingPlaceholderAnimationDuration = loginScreenAnimationDuration

const loginScreen = document.querySelector('#login-screen')
const loginForm = document.querySelector('#login-form')

const removeFullpagePopup = () => {
  // animate popup dissapearing
  loginScreen.style.transitionDuration = `${loginScreenAnimationDuration}ms`
  loginScreen.style.transitionTimingFunction = 'ease-out'
  loginScreen.style.visibility = 'hidden'
  loginScreen.style.opacity = 0
  
  setTimeout(() => {
    // remove login screen from dom after animation ends
    loginScreen.parentNode.removeChild(loginScreen)
  }, loginScreenAnimationDuration)
}

const showLoginPopup = () => {
  const loginPopup = document.querySelector('#login-popup')
  loginPopup.style.transitionDuration = `${loginPopupAnimationDuration}ms`
  loginPopup.style.transitionTimingFunction = 'ease-in'
  loginPopup.style.visibility = 'visible'
  loginPopup.style.opacity = 1
}

const logIn = async (username, password) => {
  // const requestUrl = 'http://localhost:8095/'
  const requestUrl = loginApiEndpoint
  
  return fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      login: username,
      password: password
    })
  })
}

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


export const handleLogin = async (callback) => {
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
  
  
  const username = localStorage.getItem('login')
  const password = localStorage.getItem('password')
  
  if (username && password) {
    const loginResponse = await logIn(username, password)
    
    if (loginResponse.ok) {
      const baseId = await loginResponse.text()
      callback(baseId);
      
      window.dispatchEvent(new CustomEvent('loggedInFromBrowserMemory'))
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
      callback(baseId)
      
      localStorage.setItem('login', username)
      localStorage.setItem('password', password)
      
      window.dispatchEvent(new CustomEvent('loggedInFromInput'))
      return
    } else {
      showErrorMessage()
    }
  }
}
