class Credentials {
    #login = localStorage.getItem('login')
    #password = localStorage.getItem('password')

    get login() {
        return this.#login
    }

    set login(login) {
        this.#login = login
        localStorage.setItem('login', this.#login)
    }

    get password() {
        return this.#password
    }

    set password(password) {
        this.#password = password
        localStorage.setItem('password', this.#password)
    }

    reset() {
      this.#password = null
      this.#login = null

      localStorage.removeItem('password')
      localStorage.removeItem('login')
    }
}

export const credentials = new Credentials()