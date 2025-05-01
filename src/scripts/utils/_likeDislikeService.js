class LikeDislikeService {
    likeDislikeStatus = {
        scheduled: false,
        newStatus: null
    }

    likeButton = document.querySelector('#like-button')
    dislikeButton = document.querySelector('#dislike-button')


    scheduleLikeDislike ({ newStatus }) {
        // parse an object parameter and get its newStatus key

        // make sure first letter is capitalized
        const firstLetter = newStatus[0].toUpperCase()
        const status = firstLetter + newStatus.toLowerCase().slice(1)

        if (status === 'Like') this.likeButton.classList.add('active')
        if (status === 'Dislike') this.dislikeButton.classList.add('active')

        this.likeDislikeStatus = {
            scheduled: true,
            newStatus: status
        }
    }

    resetLikeDislikeScheduledValues() {
        // clean up
        this.likeButton.classList.remove('active')
        this.dislikeButton.classList.remove('active')

        this.likeDislikeStatus = {
            scheduled: false,
            newStatus: null
        }
    }

    toggleScheduled({like = false, dislike = false}) {
        if (like) {
            if (this.likeDislikeStatus.scheduled && this.likeDislikeStatus.newStatus === 'Like') {
                this.resetLikeDislikeScheduledValues()

                return
            }

            if (this.likeDislikeStatus.scheduled && this.likeDislikeStatus.newStatus === 'Dislike') {
                this.resetLikeDislikeScheduledValues()
            }

            this.scheduleLikeDislike({ newStatus: 'Like' })
        }

        if (dislike) {
            if (this.likeDislikeStatus.scheduled && this.likeDislikeStatus.newStatus === 'Dislike') {
                this.resetLikeDislikeScheduledValues()

                return
            }

            if (this.likeDislikeStatus.scheduled && this.likeDislikeStatus.newStatus === 'Like') {
                this.resetLikeDislikeScheduledValues()
            }

            this.scheduleLikeDislike({ newStatus: 'Dislike' })
        }
    }
}

export const likeDislikeService = new LikeDislikeService()