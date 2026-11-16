import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const PAGES = {
  '/faq': {
    title: 'Frequently asked questions',
    content: (
      <>
        <strong>Is an order request confirmed immediately?</strong>
        <p>No. It is first recorded as awaiting availability confirmation. The business confirms an order before fulfilment.</p>
        <strong>Which pack sizes are available?</strong>
        <p>Available pack sizes are shown on each active product.</p>
        <strong>How do I pay?</strong>
        <p>Available methods depend on owner configuration. 100% Cash on Delivery is enabled across India.</p>
        <strong>How can I cancel?</strong>
        <p>Eligible requests can be cancelled from My Orders. For later order stages, contact the business.</p>
        <strong>Where is my delivery information?</strong>
        <p>Delivery is coordinated after the team reviews your request. Shipping estimates are communicated directly.</p>
      </>
    ),
  },
  '/shipping': {
    title: 'Shipping and delivery',
    content: (
      <p>
        Delivery options and time estimates are coordinated with customers upon order placement. Every order request is delivered safely via reputable courier partners with 100% Cash on Delivery across India.
      </p>
    ),
  },
  '/refunds': {
    title: 'Cancellation and refunds',
    content: (
      <p>
        A customer may cancel an order request before it reaches a fulfilment stage where cancellation is allowed directly from their order page. For orders already dispatched, please reach out to our support team.
      </p>
    ),
  },
  '/privacy': {
    title: 'Privacy policy',
    content: (
      <p>
        The application stores account details, saved delivery addresses, customer enquiries, order snapshots, and notifications needed to provide our services. Customers can access and manage their own account data anytime. Passwords are safe and encrypted.
      </p>
    ),
  },
  '/terms': {
    title: 'Terms and conditions',
    content: (
      <p>
        Submitting an order creates an order request. The business confirms availability and coordinates fast delivery to your door. All product details, pack sizes, and prices are clearly displayed before order placement.
      </p>
    ),
  },
};

export default function ContentPage() {
  const location = useLocation();
  const page = PAGES[location.pathname] || {
    title: 'BR Millet Choice',
    content: <p>Information page.</p>,
  };

  return (
    <>
      <PageHeader eyebrow="BR Millet Choice" title={page.title} />
      <section className="container content-shell">
        <div className="notice mb-4">
          Wholesome stone-ground unpolished millet blend freshly packed in Hyderabad.
        </div>
        <div className="policy-copy">{page.content}</div>
        <div className="mt-4">
          <Link className="btn btn-brand" to="/shop">
            Browse products
          </Link>
        </div>
      </section>
    </>
  );
}
