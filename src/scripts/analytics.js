// quickstart: https://vercel.com/docs/analytics/quickstart
// (the "other frameworks" code sample)
import { inject } from '@vercel/analytics';

if (process.env.NODE_ENV === 'production') {
    // only runs in production
    inject();
}
