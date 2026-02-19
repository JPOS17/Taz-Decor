import React from "react";
import "../styles/footer/footer.css";

const ShippingPolicy: React.FC = () => {
  return (
    <div className="legal-page">
      <h1 className="legal-page__title">Shipping &amp; Delivery Policy</h1>
      <p className="legal-page__date">Last updated February 18, 2026</p>

      <p>
        This Shipping &amp; Delivery Policy is part of our Terms and Conditions
        ("Terms") and should be read alongside our main Terms:{" "}
        <a href="https://taz-decor-catholic-company.vercel.app/terms-and-conditions">
          https://taz-decor-catholic-company.vercel.app/terms-and-conditions
        </a>
        .
      </p>
      <p>
        Please carefully review our Shipping &amp; Delivery Policy when
        purchasing our products. This policy will apply to any order you place
        with us.
      </p>

      <h2 className="legal-page__section-title">
        What Are My Shipping &amp; Delivery Options?
      </h2>
      <p>
        We offer various shipping options. In some cases a third-party supplier
        may be managing our inventory and will be responsible for shipping your
        products.
      </p>

      <h3 className="legal-page__subhead">Free Shipping</h3>
      <p>
        We offer free standard, two-day shipping on qualifying orders. Free
        shipping is limited to certain orders.
      </p>

      <h3 className="legal-page__subhead">Shipping Fees</h3>
      <p>We also offer shipping at the following rates:</p>

      <div
        style={{ overflowX: "auto", marginTop: "16px", marginBottom: "24px" }}
      >
        <table className="legal-page__table">
          <thead>
            <tr>
              <th>Shipping Method</th>
              <th>Estimated Delivery</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>USPS &ndash; Ground Advantage</td>
              <td>2&ndash;5 business days</td>
              <td>Calculated at checkout</td>
            </tr>
            <tr>
              <td>USPS &ndash; Priority Mail</td>
              <td>1&ndash;3 business days</td>
              <td>Calculated at checkout</td>
            </tr>
            <tr>
              <td>USPS &ndash; Priority Mail Express</td>
              <td>1&ndash;2 business days</td>
              <td>Calculated at checkout</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        If you select a shipping option, we will follow up after you have placed
        the order with any additional shipping information.
      </p>
      <p>
        All times and dates given for delivery of the products are given in good
        faith but are estimates only.
      </p>

      <h2 className="legal-page__section-title">
        Do You Deliver Internationally?
      </h2>
      <p>We do not offer international shipping.</p>

      <h2 className="legal-page__section-title">Questions About Returns?</h2>
      <p>
        If you have questions about returns, please review our Return Policy:{" "}
        <a href="https://taz-decor-catholic-company.vercel.app/return-policy">
          https://taz-decor-catholic-company.vercel.app/return-policy
        </a>
        .
      </p>

      <h2 className="legal-page__section-title">
        How Can You Contact Us About This Policy?
      </h2>
      <p>
        If you have any further questions or comments, you may contact us by:
      </p>
      <ul>
        <li>
          Email:{" "}
          <a href="mailto:tazdecorcatholiccompany@gmail.com">
            tazdecorcatholiccompany@gmail.com
          </a>
        </li>
      </ul>

      <p className="legal-page__footer-note">
        This Shipping Policy was created using Termly's Shipping Policy
        Generator.
      </p>
    </div>
  );
};

export default ShippingPolicy;
