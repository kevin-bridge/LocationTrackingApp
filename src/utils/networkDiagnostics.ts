import axios from 'axios';
import {API_URL} from '../config/api';

export const runNetworkDiagnostics = async (): Promise<string> => {
  const results: string[] = [];
  results.push('🔍 Network Diagnostics\n');

  // Test 1: Simple HTTPS request to a known working endpoint
  results.push('Test 1: Google connectivity...');
  try {
    const response = await axios.get('https://www.google.com', {
      timeout: 5000,
      validateStatus: () => true,
    });
    results.push(`✓ Google reachable (${response.status})\n`);
  } catch (error: any) {
    results.push(`✗ Google failed: ${error.message}\n`);
  }

  // Test 2: HTTP testing service
  results.push('Test 2: HTTPBin connectivity...');
  try {
    const response = await axios.get('https://httpbin.org/get', {
      timeout: 5000,
    });
    results.push(`✓ HTTPBin reachable (${response.status})\n`);
  } catch (error: any) {
    results.push(`✗ HTTPBin failed: ${error.message}\n`);
  }

  // Test 3: CloudFront API
  results.push('Test 3: CloudFront API...');
  try {
    const response = await axios.get(`${API_URL}/api/auth/signin`, {
      timeout: 10000,
      validateStatus: () => true,
    });
    results.push(`✓ CloudFront reachable (${response.status})\n`);
  } catch (error: any) {
    results.push(`✗ CloudFront failed: ${error.message}\n`);
    if (error.code) {
      results.push(`   Error code: ${error.code}\n`);
    }
  }

  // Test 4: Check axios configuration
  results.push('Test 4: Axios config...');
  const testInstance = axios.create({
    timeout: 5000,
  });
  results.push(`✓ Axios version: ${axios.VERSION || 'unknown'}\n`);
  results.push(`✓ Default timeout: ${testInstance.defaults.timeout}ms\n`);

  return results.join('\n');
};
