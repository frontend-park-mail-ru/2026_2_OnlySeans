export const API_BASE_URL = 'http://localhost:8080';

class HttpClient {
    async request(endpoint, options = {}) {
        const { params, headers, body, ...restOptions } = options;

        let url = `${API_BASE_URL}${endpoint}`;
        if (params) {
            const searchParams = new URLSearchParams(params).toString();
            if (searchParams) url += `?${searchParams}`;
        }

        const config = {
            method: 'GET',
            credentials: 'include',
            ...restOptions,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        if (body !== undefined) {
            if (body instanceof FormData) {
                delete config.headers['Content-Type'];
                config.body = body;
            } else if (typeof body === 'object') {
                config.body = JSON.stringify(body);
            } else {
                config.body = body;
            }
        }

        try {
            const response = await fetch(url, config);

            const responseText = response.status === 204 ? '' : await response.text();
            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    data = responseText;
                }
            }

            return { ok: response.ok, status: response.status, data };
        } catch (error) {
            console.error('HTTP Request Error:', error);
            throw error;
        }
    }

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

export const http = new HttpClient();
