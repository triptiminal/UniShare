// Loads Razorpay Checkout on demand. UniShare never touches card details: Razorpay's own popup handles them.
export function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(window.Razorpay);
    s.onerror = () => reject(new Error('Could not load Razorpay Checkout. Check your internet connection.'));
    document.body.appendChild(s);
    return undefined;
  });
}
