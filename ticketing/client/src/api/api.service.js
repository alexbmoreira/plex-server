import axios from 'axios';
import _ from 'lodash';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

export const fetchData = async (url) => {
  try {
    const response = await api.get(url);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}: ${error}`);
    throw error;
  }
};

export const postData = async (url, payload) => {
  try {
    const response = await api.post(url, payload);
    return {model: response.data.data};
  } catch (error) {
    console.error(`Error posting data to ${url}: ${error}`);

    const status = _.get(error, 'response.status');
    switch (status) {
      case 422:
        return error.response.data
      default:
        throw error;
    }
  }
};
