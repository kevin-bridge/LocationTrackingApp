/**
 * Ultra-simple network test to diagnose connectivity issues
 */
export const runSimpleNetworkTest = async (): Promise<string> => {
  const results: string[] = [];
  results.push('🔍 Simple Network Test\n');

  // Test 1: Try HTTP (not HTTPS) - simpler, no SSL
  results.push('Test 1: HTTP to httpbin.org...');
  try {
    const response = await fetch('http://httpbin.org/get', {
      method: 'GET',
      headers: {'Accept': 'application/json'},
    });
    results.push(`✓ HTTP works! Status: ${response.status}\n`);
  } catch (error: any) {
    results.push(`✗ HTTP failed: ${error.message}\n`);
  }

  // Test 2: HTTPS to httpbin.org
  results.push('Test 2: HTTPS to httpbin.org...');
  try {
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      headers: {'Accept': 'application/json'},
    });
    results.push(`✓ HTTPS works! Status: ${response.status}\n`);
  } catch (error: any) {
    results.push(`✗ HTTPS failed: ${error.message}\n`);
  }

  // Test 3: Your CloudFront API with detailed error
  results.push('Test 3: CloudFront API...');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      'https://d23iu3orp3z9g3.cloudfront.net/api/auth/signin',
      {
        method: 'GET',
        headers: {'Accept': 'application/json'},
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);
    results.push(`✓ CloudFront works! Status: ${response.status}\n`);
  } catch (error: any) {
    results.push(`✗ CloudFront failed: ${error.message}\n`);
    if (error.name === 'AbortError') {
      results.push('  (Timeout after 10 seconds)\n');
    }
  }

  // Test 4: Try direct IP if DNS is the issue (CloudFront IPs vary, so this might not work)
  results.push('Test 4: Alternative test - AWS status page...');
  try {
    const response = await fetch('https://status.aws.amazon.com/', {
      method: 'GET',
    });
    results.push(`✓ AWS accessible! Status: ${response.status}\n`);
  } catch (error: any) {
    results.push(`✗ AWS failed: ${error.message}\n`);
  }

  return results.join('\n');
};
