let recaptchaScriptPromise = null;

export function preloadRecaptchaV3(siteKey) {
    if (!siteKey) {
        return Promise.resolve(false);
    }

    if (recaptchaScriptPromise) {
        return recaptchaScriptPromise;
    }

    recaptchaScriptPromise = new Promise((resolve) => {
        const existing = document.querySelector('script[data-recaptcha-v3="true"]');
        if (existing) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
        script.async = true;
        script.defer = true;
        script.dataset.recaptchaV3 = 'true';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });

    return recaptchaScriptPromise;
}

export async function getRecaptchaV3Token(siteKey, action) {
    const loaded = await preloadRecaptchaV3(siteKey);
    if (!loaded || !window.grecaptcha || !siteKey) {
        return '';
    }

    return new Promise((resolve) => {
        window.grecaptcha.ready(async () => {
            try {
                const token = await window.grecaptcha.execute(siteKey, { action });
                resolve(token || '');
            } catch {
                resolve('');
            }
        });
    });
}
