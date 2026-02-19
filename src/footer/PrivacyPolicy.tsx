import React from "react";
import "../styles/footer/footer.css";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="legal-page">
      <h1 className="legal-page__title">Privacy Policy</h1>
      <p className="legal-page__date">Last updated February 18, 2026</p>

      <p>
        This Privacy Notice for Taz Decor ("we," "us," or "our") describes how
        and why we might access, collect, store, use, and/or share ("process")
        your personal information when you use our services ("Services"),
        including when you:
      </p>
      <ul>
        <li>
          Visit our website at{" "}
          <a href="https://taz-decor-catholic-company.vercel.app/">
            https://taz-decor-catholic-company.vercel.app/
          </a>{" "}
          or any website of ours that links to this Privacy Notice
        </li>
        <li>
          Engage with us in other related ways, including any marketing or
          events
        </li>
      </ul>
      <p>
        <strong>Questions or concerns?</strong> Reading this Privacy Notice will
        help you understand your privacy rights and choices. If you do not agree
        with our policies and practices, please do not use our Services. Contact
        us at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>
        .
      </p>

      {/* Summary */}
      <h2 className="legal-page__section-title">Summary of Key Points</h2>
      <p>
        <em>This summary provides key points from our Privacy Notice.</em>
      </p>
      <p>
        <strong>What personal information do we process?</strong> When you
        visit, use, or navigate our Services, we may process personal
        information depending on how you interact with us and the Services, the
        choices you make, and the products and features you use.
      </p>
      <p>
        <strong>Do we process any sensitive personal information?</strong> Some
        of the information may be considered "special" or "sensitive" in certain
        jurisdictions. We do not process sensitive personal information.
      </p>
      <p>
        <strong>Do we collect any information from third parties?</strong> We do
        not collect any information from third parties.
      </p>
      <p>
        <strong>How do we process your information?</strong> We process your
        information to provide, improve, and administer our Services,
        communicate with you, for security and fraud prevention, and to comply
        with law.
      </p>
      <p>
        <strong>
          In what situations and with which parties do we share personal
          information?
        </strong>{" "}
        We may share information in specific situations and with specific third
        parties.
      </p>
      <p>
        <strong>How do we keep your information safe?</strong> We have adequate
        organizational and technical processes and procedures in place to
        protect your personal information. However, no electronic transmission
        over the internet can be guaranteed to be 100% secure.
      </p>
      <p>
        <strong>What are your rights?</strong> Depending on where you are
        located geographically, the applicable privacy law may mean you have
        certain rights regarding your personal information.
      </p>
      <p>
        <strong>How do you exercise your rights?</strong> The easiest way to
        exercise your rights is by submitting a data subject access request, or
        by contacting us.
      </p>

      {/* Table of Contents */}
      <h2 className="legal-page__section-title">Table of Contents</h2>
      <ol className="legal-page__toc">
        {[
          "What Information Do We Collect?",
          "How Do We Process Your Information?",
          "When and With Whom Do We Share Your Personal Information?",
          "Do We Use Cookies and Other Tracking Technologies?",
          "How Do We Handle Your Social Logins?",
          "How Long Do We Keep Your Information?",
          "How Do We Keep Your Information Safe?",
          "Do We Collect Information From Minors?",
          "What Are Your Privacy Rights?",
          "Controls for Do-Not-Track Features",
          "Do United States Residents Have Specific Privacy Rights?",
          "Do We Make Updates to This Notice?",
          "How Can You Contact Us About This Notice?",
          "How Can You Review, Update, or Delete the Data We Collect From You?",
        ].map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>

      <h2 className="legal-page__section-title">
        1. What Information Do We Collect?
      </h2>
      <h3 className="legal-page__subhead">
        Personal information you disclose to us
      </h3>
      <p>
        <em>
          In Short: We collect personal information that you provide to us.
        </em>
      </p>
      <p>
        We collect personal information that you voluntarily provide to us when
        you register on the Services, express an interest in obtaining
        information about us or our products and Services, when you participate
        in activities on the Services, or otherwise when you contact us.
      </p>
      <p>
        <strong>Personal Information Provided by You.</strong> The personal
        information we collect may include the following:
      </p>
      <ul>
        <li>Names</li>
        <li>Phone numbers</li>
        <li>Email addresses</li>
        <li>Mailing addresses</li>
        <li>Usernames</li>
        <li>Passwords</li>
      </ul>
      <p>
        <strong>Sensitive Information.</strong> We do not process sensitive
        information.
      </p>
      <p>
        <strong>Social Media Login Data.</strong> We may provide you with the
        option to register with us using your existing social media account
        details. If you choose to register in this way, we will collect certain
        profile information about you from the social media provider.
      </p>
      <p>
        All personal information that you provide to us must be true, complete,
        and accurate, and you must notify us of any changes to such personal
        information.
      </p>

      <h2 className="legal-page__section-title">
        2. How Do We Process Your Information?
      </h2>
      <p>
        <em>
          In Short: We process your information to provide, improve, and
          administer our Services, communicate with you, for security and fraud
          prevention, and to comply with law.
        </em>
      </p>
      <p>
        We process your personal information for a variety of reasons,
        including:
      </p>
      <ul>
        <li>
          <strong>
            To facilitate account creation and authentication and otherwise
            manage user accounts.
          </strong>
        </li>
        <li>
          <strong>
            To deliver and facilitate delivery of services to the user.
          </strong>
        </li>
        <li>
          <strong>To respond to user inquiries/offer support to users.</strong>
        </li>
        <li>
          <strong>To send administrative information to you.</strong>
        </li>
        <li>
          <strong>To fulfill and manage your orders.</strong>
        </li>
        <li>
          <strong>To send you marketing and promotional communications.</strong>{" "}
          You can opt out at any time.
        </li>
        <li>
          <strong>To protect our Services.</strong>
        </li>
      </ul>

      <h2 className="legal-page__section-title">
        3. When and With Whom Do We Share Your Personal Information?
      </h2>
      <p>
        <em>
          In Short: We may share information in specific situations described in
          this section and/or with the following third parties.
        </em>
      </p>
      <ul>
        <li>
          <strong>Business Transfers.</strong> We may share or transfer your
          information in connection with, or during negotiations of, any merger,
          sale of company assets, financing, or acquisition of all or a portion
          of our business to another company.
        </li>
      </ul>

      <h2 className="legal-page__section-title">
        4. Do We Use Cookies and Other Tracking Technologies?
      </h2>
      <p>
        <em>
          In Short: We may use cookies and other tracking technologies to
          collect and store your information.
        </em>
      </p>
      <p>
        We may use cookies and similar tracking technologies (like web beacons
        and pixels) to gather information when you interact with our Services.
        Some online tracking technologies help us maintain the security of our
        Services and your account, prevent crashes, fix bugs, save your
        preferences, and assist with basic site functions.
      </p>
      <p>
        We also permit third parties and service providers to use online
        tracking technologies on our Services for analytics and advertising
        purposes.
      </p>
      <p>
        To the extent these online tracking technologies are deemed to be a
        "sale"/"sharing" under applicable US state laws, you can opt out by
        submitting a request as described in the section "Do United States
        Residents Have Specific Privacy Rights?" below.
      </p>

      <h2 className="legal-page__section-title">
        5. How Do We Handle Your Social Logins?
      </h2>
      <p>
        <em>
          In Short: If you choose to register or log in to our Services using a
          social media account, we may have access to certain information about
          you.
        </em>
      </p>
      <p>
        Our Services offer you the ability to register and log in using your
        third-party social media account details (like your Facebook or X
        logins). We will receive certain profile information about you from your
        social media provider, which will often include your name, email
        address, friends list, and profile picture.
      </p>
      <p>
        We will use the information we receive only for the purposes described
        in this Privacy Notice. Please note that we do not control, and are not
        responsible for, other uses of your personal information by your
        third-party social media provider.
      </p>

      <h2 className="legal-page__section-title">
        6. How Long Do We Keep Your Information?
      </h2>
      <p>
        <em>
          In Short: We keep your information for as long as necessary to fulfill
          the purposes outlined in this Privacy Notice unless otherwise required
          by law.
        </em>
      </p>
      <p>
        We will only keep your personal information for as long as it is
        necessary for the purposes set out in this Privacy Notice, unless a
        longer retention period is required or permitted by law. No purpose in
        this notice will require us keeping your personal information for longer
        than the period of time in which users have an account with us.
      </p>
      <p>
        When we have no ongoing legitimate business need to process your
        personal information, we will either delete or anonymize such
        information, or isolate it from any further processing until deletion is
        possible.
      </p>

      <h2 className="legal-page__section-title">
        7. How Do We Keep Your Information Safe?
      </h2>
      <p>
        <em>
          In Short: We aim to protect your personal information through a system
          of organizational and technical security measures.
        </em>
      </p>
      <p>
        We have implemented appropriate and reasonable technical and
        organizational security measures designed to protect the security of any
        personal information we process. However, no electronic transmission
        over the Internet or information storage technology can be guaranteed to
        be 100% secure. You should only access the Services within a secure
        environment.
      </p>

      <h2 className="legal-page__section-title">
        8. Do We Collect Information From Minors?
      </h2>
      <p>
        <em>
          In Short: We do not knowingly collect data from or market to children
          under 18 years of age.
        </em>
      </p>
      <p>
        We do not knowingly collect, solicit data from, or market to children
        under 18 years of age. By using the Services, you represent that you are
        at least 18 or that you are the parent or guardian of such a minor and
        consent to such minor dependent's use of the Services. If we learn that
        personal information from users less than 18 years of age has been
        collected, we will deactivate the account and take reasonable measures
        to promptly delete such data. Please contact us at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>{" "}
        if you become aware of any such data.
      </p>

      <h2 className="legal-page__section-title">
        9. What Are Your Privacy Rights?
      </h2>
      <p>
        <em>
          In Short: You may review, change, or terminate your account at any
          time, depending on your country, province, or state of residence.
        </em>
      </p>
      <p>
        <strong>Withdrawing your consent:</strong> If we are relying on your
        consent to process your personal information, you have the right to
        withdraw your consent at any time by contacting us.
      </p>
      <p>
        <strong>Opting out of marketing and promotional communications:</strong>{" "}
        You can unsubscribe from our marketing and promotional communications at
        any time by clicking on the unsubscribe link in the emails that we send,
        or by contacting us.
      </p>
      <h3 className="legal-page__subhead">Account Information</h3>
      <p>
        If you would at any time like to review or change the information in
        your account or terminate your account, you can log in to your account
        settings and update your user account. Upon your request to terminate
        your account, we will deactivate or delete your account and information
        from our active databases.
      </p>
      <p>
        If you have questions or comments about your privacy rights, you may
        email us at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>
        .
      </p>

      <h2 className="legal-page__section-title">
        10. Controls for Do-Not-Track Features
      </h2>
      <p>
        Most web browsers and some mobile operating systems include a
        Do-Not-Track ("DNT") feature or setting you can activate to signal your
        privacy preference. At this stage, no uniform technology standard for
        recognizing and implementing DNT signals has been finalized. As such, we
        do not currently respond to DNT browser signals. California law requires
        us to let you know how we respond to web browser DNT signals — because
        there is currently no industry or legal standard for honoring DNT
        signals, we do not respond to them at this time.
      </p>

      <h2 className="legal-page__section-title">
        11. Do United States Residents Have Specific Privacy Rights?
      </h2>
      <p>
        <em>
          In Short: If you are a resident of Texas, you may have the right to
          request access to and receive details about the personal information
          we maintain about you, correct inaccuracies, get a copy of, or delete
          your personal information.
        </em>
      </p>
      <h3 className="legal-page__subhead">
        Categories of Personal Information We Collect
      </h3>
      <p>
        The table below shows the categories of personal information we have
        collected in the past twelve (12) months. All categories listed below
        are marked as NOT collected.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="legal-page__table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Examples</th>
              <th>Collected</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "A. Identifiers",
                "Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, IP address, email address, and account name",
                "NO",
              ],
              [
                "B. Protected classification characteristics",
                "Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data",
                "NO",
              ],
              [
                "C. Commercial information",
                "Transaction information, purchase history, financial details, and payment information",
                "NO",
              ],
              [
                "D. Biometric information",
                "Fingerprints and voiceprints",
                "NO",
              ],
              [
                "E. Internet or other similar network activity",
                "Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements",
                "NO",
              ],
              ["F. Geolocation data", "Device location", "NO"],
              [
                "G. Audio, electronic, sensory, or similar information",
                "Images and audio, video or call recordings created in connection with our business activities",
                "NO",
              ],
              [
                "H. Professional or employment-related information",
                "Business contact details, job title, work history, and professional qualifications",
                "NO",
              ],
              [
                "I. Education information",
                "Student records and directory information",
                "NO",
              ],
              [
                "J. Inferences drawn from collected personal information",
                "Profile or summary about an individual's preferences and characteristics",
                "NO",
              ],
              ["K. Sensitive personal information", "", "NO"],
            ].map(([cat, ex, col], i) => (
              <tr key={i}>
                <td>
                  <strong>{cat}</strong>
                </td>
                <td>{ex}</td>
                <td>{col}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="legal-page__subhead">Your Rights</h3>
      <ul>
        <li>
          Right to know whether or not we are processing your personal data
        </li>
        <li>Right to access your personal data</li>
        <li>Right to correct inaccuracies in your personal data</li>
        <li>Right to request the deletion of your personal data</li>
        <li>
          Right to obtain a copy of the personal data you previously shared with
          us
        </li>
        <li>Right to non-discrimination for exercising your rights</li>
        <li>
          Right to opt out of the processing of your personal data for targeted
          advertising, sale of personal data, or profiling
        </li>
      </ul>
      <h3 className="legal-page__subhead">How to Exercise Your Rights</h3>
      <p>
        To exercise these rights, you can contact us by emailing us at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>{" "}
        or by referring to the contact details at the bottom of this document.
      </p>
      <h3 className="legal-page__subhead">Appeals</h3>
      <p>
        Under certain US state data protection laws, if we decline to take
        action regarding your request, you may appeal our decision by emailing
        us at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>
        . If your appeal is denied, you may submit a complaint to your state
        attorney general.
      </p>

      <h2 className="legal-page__section-title">
        12. Do We Make Updates to This Notice?
      </h2>
      <p>
        <em>
          In Short: Yes, we will update this notice as necessary to stay
          compliant with relevant laws.
        </em>
      </p>
      <p>
        We may update this Privacy Notice from time to time. The updated version
        will be indicated by an updated "Revised" date at the top of this
        Privacy Notice. We encourage you to review this Privacy Notice
        frequently to be informed of how we are protecting your information.
      </p>

      <h2 className="legal-page__section-title">
        13. How Can You Contact Us About This Notice?
      </h2>
      <p>
        If you have questions or comments about this notice, you may email us at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>
        .
      </p>

      <h2 className="legal-page__section-title">
        14. How Can You Review, Update, or Delete the Data We Collect From You?
      </h2>
      <p>
        You have the right to request access to the personal information we
        collect from you, details about how we have processed it, correct
        inaccuracies, or delete your personal information. These rights may be
        limited in some circumstances by applicable law. To request to review,
        update, or delete your personal information, please fill out and submit
        a data subject access request.
      </p>

      <p className="legal-page__footer-note">
        This Privacy Policy was created using Termly's Privacy Policy Generator.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
