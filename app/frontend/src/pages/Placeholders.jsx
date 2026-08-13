import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PageTemplate = ({ title, children }) => (
  <div className="container page-enter" style={{ padding: '4rem 1.5rem', maxWidth: '800px' }}>
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
      <ArrowLeft size={16} /> Back to Home
    </Link>
    <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>{title}</h1>
    <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {children}
    </div>
  </div>
);

export const About = () => (
  <PageTemplate title="About Ecom Commerce">
    <p>Welcome to Ecom Commerce. We are a premium e-commerce platform dedicated to providing the highest quality products with a modern, elegant aesthetic.</p>
    <p>Founded in 2026, our mission is to redefine online shopping by combining cutting-edge technology with minimalist design principles.</p>
  </PageTemplate>
);

export const Legal = () => (
  <PageTemplate title="Terms & Privacy Policy">
    <h2>Privacy Policy</h2>
    <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your data.</p>
    <h2>Terms of Service</h2>
    <p>By using our platform, you agree to our terms of service. All purchases are subject to availability and confirmation of the order price.</p>
  </PageTemplate>
);

export const FAQ = () => <PageTemplate title="Frequently Asked Questions"><p>Coming soon...</p></PageTemplate>;
export const RefundPolicy = () => <PageTemplate title="Refund & Return Policy"><p>We offer a 30-day return policy for unused items in original packaging.</p></PageTemplate>;
export const ShippingPolicy = () => <PageTemplate title="Shipping Policy"><p>Orders are typically processed within 24 hours. Express shipping takes 1-3 business days.</p></PageTemplate>;
export const CookiePolicy = () => <PageTemplate title="Cookie Policy"><p>We use essential cookies to ensure the basic functionality of the website.</p></PageTemplate>;
export const Disclaimer = () => <PageTemplate title="Disclaimer"><p>Information provided on this site is for general informational purposes only.</p></PageTemplate>;
export const Careers = () => <PageTemplate title="Careers"><p>We are currently not hiring. Check back later!</p></PageTemplate>;
export const Blog = () => <PageTemplate title="Blog"><p>Read our latest news and updates here.</p></PageTemplate>;

