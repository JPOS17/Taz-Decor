import React from "react";
import "../styles/footer/footer.css";

const ReturnPolicy: React.FC = () => {
  return (
    <div className="legal-page">
      <h1 className="legal-page__title">Return Policy</h1>
      <p className="legal-page__date">Last updated February 18, 2026</p>

      <p>
        Thank you for shopping at Taz Decor. We appreciate your business and
        want to make sure you are completely satisfied with your purchase.
        Please read the following policy carefully before making a purchase.
      </p>

      <h2 className="legal-page__section-title">Refunds</h2>
      <p>
        We offer refunds on eligible items. Refunds will be issued in US dollars
        to the original payment method.
      </p>

      <h2 className="legal-page__section-title">Returns</h2>
      <p>
        <strong>
          Returns are only accepted for items that arrive damaged or defective.
        </strong>{" "}
        Customers must contact us at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>{" "}
        within <strong>7 days of delivery</strong> with photo evidence of the
        damage or defect before a return will be authorized.{" "}
        <strong>All other sales are final.</strong>
      </p>
      <p>
        Discounted items are eligible for return under the same conditions
        above.
      </p>

      <h2 className="legal-page__section-title">Return Authorization</h2>
      <p>
        Customers <strong>must receive authorization</strong> before returning
        an item. To initiate a return, please contact us at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>{" "}
        with:
      </p>
      <ul>
        <li>Your order information and proof of purchase</li>
        <li>Photo evidence of the damage or defect</li>
      </ul>
      <p>
        We will review your request and, if approved, provide return
        instructions. Unauthorized returns will not be accepted.
      </p>

      <h2 className="legal-page__section-title">
        Return Deadlines &amp; Processing
      </h2>
      <p>
        Return packages must be <strong>postmarked within 7 days</strong> of the
        original purchase date. Once we receive your return, please allow up to{" "}
        <strong>7 business days</strong> for it to be processed. You will be
        notified by email once your return has been processed.
      </p>

      <h2 className="legal-page__section-title">Return Shipping</h2>
      <p>
        We cover the cost of return shipping for approved returns. Once your
        return is authorized, we will provide you with return instructions.
        Please contact us at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>{" "}
        to initiate the process.
      </p>

      <h2 className="legal-page__section-title">Restocking Fees</h2>
      <p>We do not charge any restocking fees.</p>

      <h2 className="legal-page__section-title">Questions</h2>
      <p>
        If you have any questions concerning our return policy, please contact
        us at:
      </p>
      <p>
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>
      </p>

      <p className="legal-page__footer-note">
        This Return Policy was created using Termly's Return and Refund Policy
        Generator.
      </p>
    </div>
  );
};

export default ReturnPolicy;
