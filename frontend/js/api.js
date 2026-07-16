class ApiService {
  async request(endpoint, options = {}) {
    const response = await window.auth.fetchWithAuth(endpoint, options);
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error((data && data.error) ? data.error : 'Erro na requisição');
    }

    return { response, data };
  }

  async get(endpoint) {
    const { data } = await this.request(endpoint);
    return data;
  }

  async post(endpoint, body, isFormData = false) {
    const options = { method: 'POST' };
    if (body) {
      if (isFormData) {
        options.body = body;
      } else {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }
    }
    const { data } = await this.request(endpoint, options);
    return data;
  }

  async put(endpoint, body) {
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    };
    const { data } = await this.request(endpoint, options);
    return data;
  }

  async delete(endpoint) {
    const { data } = await this.request(endpoint, { method: 'DELETE' });
    return data;
  }
}

window.api = new ApiService();
