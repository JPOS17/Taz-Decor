import React from "react";
import "../styles/footer/footer.css";

const TermsAndConditions: React.FC = () => {
  return (
    <div className="legal-page">
      <h1 className="legal-page__title">Terms and Conditions</h1>
      <p className="legal-page__date">Last updated February 18, 2026</p>

      <h2 className="legal-page__section-title">
        Agreement to Our Legal Terms
      </h2>
      <p>
        We are Taz Decor ("Company," "we," "us," "our"). We operate the website{" "}
        <a href="https://taz-decor-catholic-company.vercel.app">
          https://taz-decor-catholic-company.vercel.app
        </a>{" "}
        (the "Site"), as well as any other related products and services that
        refer or link to these legal terms (the "Legal Terms") (collectively,
        the "Services").
      </p>
      <p>
        You can contact us by email at{" "}
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>{" "}
        or by mail to: 107 Resilient Gale Ct, Magnolia, Texas 77354, United
        States.
      </p>
      <p>
        These Legal Terms constitute a legally binding agreement made between
        you, whether personally or on behalf of an entity ("you"), and Taz
        Decor, concerning your access to and use of the Services. You agree that
        by accessing the Services, you have read, understood, and agreed to be
        bound by all of these Legal Terms.{" "}
        <strong>
          IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE
          EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE
          USE IMMEDIATELY.
        </strong>
      </p>
      <p>
        We reserve the right, in our sole discretion, to make changes or
        modifications to these Legal Terms at any time and for any reason. We
        will alert you about any changes by updating the "Last updated" date of
        these Legal Terms. It is your responsibility to periodically review
        these Legal Terms to stay informed of updates.
      </p>
      <p>
        We have also posted our Privacy Policy on the Services. Please review
        our{" "}
        <a href="https://taz-decor-catholic-company.vercel.app/privacy-policy">
          Privacy Policy
        </a>
        , which is incorporated into these Legal Terms by this reference.
      </p>
      <p>
        We recommend that you print a copy of these Legal Terms for your
        records.
      </p>

      {/* Table of Contents */}
      <h2 className="legal-page__section-title">Table of Contents</h2>
      <ol className="legal-page__toc">
        {[
          "Our Services",
          "Intellectual Property Rights",
          "User Representations",
          "Prohibited Activities",
          "User Generated Contributions",
          "Contribution License",
          "Services Management",
          "Term and Termination",
          "Modifications and Interruptions",
          "Governing Law",
          "Dispute Resolution",
          "Corrections",
          "Disclaimer",
          "Limitations of Liability",
          "Indemnification",
          "User Data",
          "Electronic Communications, Transactions, and Signatures",
          "Miscellaneous",
          "Contact Us",
        ].map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>

      <h2 className="legal-page__section-title">1. Our Services</h2>
      <p>
        The information provided when using the Services is not intended for
        distribution to or use by any person or entity in any jurisdiction or
        country where such distribution or use would be contrary to law or
        regulation or which would subject us to any registration requirement
        within such jurisdiction or country. Those persons who choose to access
        the Services from other locations do so on their own initiative and are
        solely responsible for compliance with local laws, if and to the extent
        local laws are applicable.
      </p>

      <h2 className="legal-page__section-title">
        2. Intellectual Property Rights
      </h2>
      <h3 className="legal-page__subhead">Our intellectual property</h3>
      <p>
        We are the owner or the licensee of all intellectual property rights in
        our Services, including all source code, databases, functionality,
        software, website designs, audio, video, text, photographs, and graphics
        in the Services (collectively, the "Content"), as well as the
        trademarks, service marks, and logos contained therein (the "Marks").
      </p>
      <p>
        Our Content and Marks are protected by copyright and trademark laws and
        treaties around the world. The Content and Marks are provided in or
        through the Services "AS IS" for your personal, non-commercial use or
        internal business purpose only.
      </p>

      <h3 className="legal-page__subhead">Your use of our Services</h3>
      <p>
        Subject to your compliance with these Legal Terms, we grant you a
        non-exclusive, non-transferable, revocable license to:
      </p>
      <ul>
        <li>access the Services; and</li>
        <li>
          download or print a copy of any portion of the Content to which you
          have properly gained access,
        </li>
      </ul>
      <p>
        solely for your personal, non-commercial use or internal business
        purpose.
      </p>
      <p>
        Except as set out in this section or elsewhere in our Legal Terms, no
        part of the Services and no Content or Marks may be copied, reproduced,
        aggregated, republished, uploaded, posted, publicly displayed, encoded,
        translated, transmitted, distributed, sold, licensed, or otherwise
        exploited for any commercial purpose whatsoever, without our express
        prior written permission.
      </p>
      <p>
        Any breach of these Intellectual Property Rights will constitute a
        material breach of our Legal Terms and your right to use our Services
        will terminate immediately.
      </p>

      <h3 className="legal-page__subhead">Your submissions</h3>
      <p>
        By directly sending us any question, comment, suggestion, idea,
        feedback, or other information about the Services ("Submissions"), you
        agree to assign to us all intellectual property rights in such
        Submission. You agree that we shall own this Submission and be entitled
        to its unrestricted use and dissemination for any lawful purpose,
        commercial or otherwise, without acknowledgment or compensation to you.
      </p>
      <p>
        You are solely responsible for your Submissions and you expressly agree
        to reimburse us for any and all losses that we may suffer because of
        your breach of this section, any third party's intellectual property
        rights, or applicable law.
      </p>

      <h2 className="legal-page__section-title">3. User Representations</h2>
      <p>By using the Services, you represent and warrant that:</p>
      <ol>
        <li>
          you have the legal capacity and you agree to comply with these Legal
          Terms;
        </li>
        <li>you are not a minor in the jurisdiction in which you reside;</li>
        <li>
          you will not access the Services through automated or non-human means,
          whether through a bot, script or otherwise;
        </li>
        <li>
          you will not use the Services for any illegal or unauthorized purpose;
          and
        </li>
        <li>
          your use of the Services will not violate any applicable law or
          regulation.
        </li>
      </ol>
      <p>
        If you provide any information that is untrue, inaccurate, not current,
        or incomplete, we have the right to suspend or terminate your account
        and refuse any and all current or future use of the Services (or any
        portion thereof).
      </p>

      <h2 className="legal-page__section-title">4. Prohibited Activities</h2>
      <p>
        You may not access or use the Services for any purpose other than that
        for which we make the Services available. As a user of the Services, you
        agree not to:
      </p>
      <ul>
        <li>
          Systematically retrieve data or other content from the Services to
          create or compile a collection, compilation, database, or directory
          without written permission from us.
        </li>
        <li>
          Trick, defraud, or mislead us and other users, especially in any
          attempt to learn sensitive account information such as user passwords.
        </li>
        <li>
          Circumvent, disable, or otherwise interfere with security-related
          features of the Services.
        </li>
        <li>
          Disparage, tarnish, or otherwise harm, in our opinion, us and/or the
          Services.
        </li>
        <li>
          Use any information obtained from the Services in order to harass,
          abuse, or harm another person.
        </li>
        <li>
          Make improper use of our support services or submit false reports of
          abuse or misconduct.
        </li>
        <li>
          Use the Services in a manner inconsistent with any applicable laws or
          regulations.
        </li>
        <li>Engage in unauthorized framing of or linking to the Services.</li>
        <li>
          Upload or transmit (or attempt to upload or to transmit) viruses,
          Trojan horses, or other material that interferes with any party's
          uninterrupted use and enjoyment of the Services.
        </li>
        <li>
          Engage in any automated use of the system, such as using scripts to
          send comments or messages, or using any data mining, robots, or
          similar data gathering and extraction tools.
        </li>
        <li>
          Delete the copyright or other proprietary rights notice from any
          Content.
        </li>
        <li>
          Attempt to impersonate another user or person or use the username of
          another user.
        </li>
        <li>Sell or otherwise transfer your profile.</li>
        <li>
          Upload or transmit any material that acts as a passive or active
          information collection or transmission mechanism.
        </li>
        <li>
          Interfere with, disrupt, or create an undue burden on the Services or
          the networks or services connected to the Services.
        </li>
        <li>
          Harass, annoy, intimidate, or threaten any of our employees or agents
          engaged in providing any portion of the Services to you.
        </li>
        <li>
          Attempt to bypass any measures of the Services designed to prevent or
          restrict access to the Services, or any portion of the Services.
        </li>
        <li>
          Copy or adapt the Services' software, including but not limited to
          Flash, PHP, HTML, JavaScript, or other code.
        </li>
        <li>
          Decipher, decompile, disassemble, or reverse engineer any of the
          software comprising or in any way making up a part of the Services.
        </li>
        <li>
          Use a buying agent or purchasing agent to make purchases on the
          Services.
        </li>
        <li>
          Make any unauthorized use of the Services, including collecting
          usernames and/or email addresses of users by electronic or other means
          for the purpose of sending unsolicited email, or creating user
          accounts by automated means or under false pretenses.
        </li>
        <li>
          Use the Services as part of any effort to compete with us or otherwise
          use the Services and/or the Content for any revenue-generating
          endeavor or commercial enterprise.
        </li>
      </ul>

      <h2 className="legal-page__section-title">
        5. User Generated Contributions
      </h2>
      <p>
        The Services do not offer users to submit or post content. We may
        provide you with the opportunity to create, submit, post, display,
        transmit, perform, publish, distribute, or broadcast content and
        materials to us or on the Services (collectively, "Contributions"). When
        you create or make available any Contributions, you represent and
        warrant that your Contributions comply with our Legal Terms and all
        applicable laws.
      </p>

      <h2 className="legal-page__section-title">6. Contribution License</h2>
      <p>
        You and Services agree that we may access, store, process, and use any
        information and personal data that you provide and your choices
        (including settings).
      </p>
      <p>
        By submitting suggestions or other feedback regarding the Services, you
        agree that we can use and share such feedback for any purpose without
        compensation to you.
      </p>
      <p>
        We do not assert any ownership over your Contributions. You retain full
        ownership of all of your Contributions and any intellectual property
        rights or other proprietary rights associated with your Contributions.
        We are not liable for any statements or representations in your
        Contributions. You are solely responsible for your Contributions to the
        Services and you expressly agree to exonerate us from any and all
        responsibility and to refrain from any legal action against us regarding
        your Contributions.
      </p>

      <h2 className="legal-page__section-title">7. Services Management</h2>
      <p>
        We reserve the right, but not the obligation, to: (1) monitor the
        Services for violations of these Legal Terms; (2) take appropriate legal
        action against anyone who, in our sole discretion, violates the law or
        these Legal Terms; (3) refuse, restrict access to, limit the
        availability of, or disable any of your Contributions or any portion
        thereof; (4) remove from the Services or otherwise disable all files and
        content that are excessive in size or are in any way burdensome to our
        systems; and (5) otherwise manage the Services in a manner designed to
        protect our rights and property and to facilitate the proper functioning
        of the Services.
      </p>

      <h2 className="legal-page__section-title">8. Term and Termination</h2>
      <p>
        These Legal Terms shall remain in full force and effect while you use
        the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS,
        WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR
        LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING
        CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON. WE
        MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE ANY
        CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN
        OUR SOLE DISCRETION.
      </p>
      <p>
        If we terminate or suspend your account for any reason, you are
        prohibited from registering and creating a new account under your name,
        a fake or borrowed name, or the name of any third party. In addition to
        terminating or suspending your account, we reserve the right to take
        appropriate legal action, including without limitation pursuing civil,
        criminal, and injunctive redress.
      </p>

      <h2 className="legal-page__section-title">
        9. Modifications and Interruptions
      </h2>
      <p>
        We reserve the right to change, modify, or remove the contents of the
        Services at any time or for any reason at our sole discretion without
        notice. We will not be liable to you or any third party for any
        modification, price change, suspension, or discontinuance of the
        Services.
      </p>
      <p>
        We cannot guarantee the Services will be available at all times. We may
        experience hardware, software, or other problems or need to perform
        maintenance related to the Services, resulting in interruptions, delays,
        or errors. You agree that we have no liability whatsoever for any loss,
        damage, or inconvenience caused by your inability to access or use the
        Services during any downtime or discontinuance of the Services.
      </p>

      <h2 className="legal-page__section-title">10. Governing Law</h2>
      <p>
        These Legal Terms shall be governed by and defined following the laws of
        the State of Texas, United States. Taz Decor and yourself irrevocably
        consent that the courts of Texas shall have exclusive jurisdiction to
        resolve any dispute which may arise in connection with these Legal
        Terms.
      </p>

      <h2 className="legal-page__section-title">11. Dispute Resolution</h2>
      <h3 className="legal-page__subhead">Informal Negotiations</h3>
      <p>
        To expedite resolution and control the cost of any dispute, controversy,
        or claim related to these Legal Terms (each a "Dispute"), the Parties
        agree to first attempt to negotiate any Dispute informally for at least{" "}
        <strong>30 days</strong> before initiating arbitration. Such informal
        negotiations commence upon written notice from one Party to the other
        Party.
      </p>

      <h3 className="legal-page__subhead">Binding Arbitration</h3>
      <p>
        Any dispute arising out of or in connection with these Legal Terms shall
        be referred to and finally resolved by arbitration. The seat, or legal
        place, of arbitration shall be{" "}
        <strong>Harris County, Texas, United States</strong>. The governing law
        of these Legal Terms shall be the substantive law of Texas.
      </p>

      <h3 className="legal-page__subhead">Restrictions</h3>
      <p>
        The Parties agree that any arbitration shall be limited to the Dispute
        between the Parties individually. To the full extent permitted by law,
        (a) no arbitration shall be joined with any other proceeding; (b) there
        is no right or authority for any Dispute to be arbitrated on a
        class-action basis; and (c) there is no right or authority for any
        Dispute to be brought in a purported representative capacity on behalf
        of the general public or any other persons.
      </p>

      <h3 className="legal-page__subhead">
        Exceptions to Informal Negotiations and Arbitration
      </h3>
      <p>
        The Parties agree that the following Disputes are not subject to the
        above provisions: (a) any Disputes seeking to enforce or protect, or
        concerning the validity of, any of the intellectual property rights of a
        Party; (b) any Dispute related to, or arising from, allegations of
        theft, piracy, invasion of privacy, or unauthorized use; and (c) any
        claim for injunctive relief.
      </p>

      <h3 className="legal-page__subhead">Time Limitation on Claims</h3>
      <p>
        You agree that any cause of action arising out of or related to the
        Services must commence within <strong>2 years</strong> after the cause
        of action accrues. Otherwise, such cause of action is permanently
        barred.
      </p>

      <h2 className="legal-page__section-title">12. Corrections</h2>
      <p>
        There may be information on the Services that contains typographical
        errors, inaccuracies, or omissions, including descriptions, pricing,
        availability, and various other information. We reserve the right to
        correct any errors, inaccuracies, or omissions and to change or update
        the information on the Services at any time, without prior notice.
      </p>

      <h2 className="legal-page__section-title">13. Disclaimer</h2>
      <p className="legal-page__uppercase-block">
        The services are provided on an as-is and as-available basis. You agree
        that your use of the services will be at your sole risk. To the fullest
        extent permitted by law, we disclaim all warranties, express or implied,
        in connection with the services and your use thereof, including, without
        limitation, the implied warranties of merchantability, fitness for a
        particular purpose, and non-infringement. We make no warranties or
        representations about the accuracy or completeness of the services'
        content or the content of any websites or mobile applications linked to
        the services and we will assume no liability or responsibility for any
        (1) errors, mistakes, or inaccuracies of content and materials, (2)
        personal injury or property damage of any nature whatsoever resulting
        from your access to and use of the services, (3) any unauthorized access
        to or use of our secure servers and/or any and all personal information
        and/or financial information stored therein, (4) any interruption or
        cessation of transmission to or from the services, (5) any bugs,
        viruses, Trojan horses, or the like which may be transmitted to or
        through the services by any third party, and/or (6) any errors or
        omissions in any content and materials or for any loss or damage of any
        kind incurred as a result of the use of any content posted, transmitted,
        or otherwise made available via the services.
      </p>

      <h2 className="legal-page__section-title">
        14. Limitations of Liability
      </h2>
      <p className="legal-page__uppercase-block">
        In no event will we or our directors, employees, or agents be liable to
        you or any third party for any direct, indirect, consequential,
        exemplary, incidental, special, or punitive damages, including lost
        profit, lost revenue, loss of data, or other damages arising from your
        use of the services, even if we have been advised of the possibility of
        such damages. Notwithstanding anything to the contrary contained herein,
        our liability to you for any cause whatsoever and regardless of the form
        of the action, will at all times be limited to the lesser of the amount
        paid, if any, by you to us. Certain US state laws and international laws
        do not allow limitations on implied warranties or the exclusion or
        limitation of certain damages. If these laws apply to you, some or all
        of the above disclaimers or limitations may not apply to you, and you
        may have additional rights.
      </p>

      <h2 className="legal-page__section-title">15. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold us harmless, including our
        subsidiaries, affiliates, and all of our respective officers, agents,
        partners, and employees, from and against any loss, damage, liability,
        claim, or demand, including reasonable attorneys' fees and expenses,
        made by any third party due to or arising out of: (1) use of the
        Services; (2) breach of these Legal Terms; (3) any breach of your
        representations and warranties set forth in these Legal Terms; (4) your
        violation of the rights of a third party, including but not limited to
        intellectual property rights; or (5) any overt harmful act toward any
        other user of the Services with whom you connected via the Services. We
        reserve the right, at your expense, to assume the exclusive defense and
        control of any matter for which you are required to indemnify us, and
        you agree to cooperate, at your expense, with our defense of such
        claims.
      </p>

      <h2 className="legal-page__section-title">16. User Data</h2>
      <p>
        We will maintain certain data that you transmit to the Services for the
        purpose of managing the performance of the Services, as well as data
        relating to your use of the Services. Although we perform regular
        routine backups of data, you are solely responsible for all data that
        you transmit or that relates to any activity you have undertaken using
        the Services. You agree that we shall have no liability to you for any
        loss or corruption of any such data, and you hereby waive any right of
        action against us arising from any such loss or corruption of such data.
      </p>

      <h2 className="legal-page__section-title">
        17. Electronic Communications, Transactions, and Signatures
      </h2>
      <p>
        Visiting the Services, sending us emails, and completing online forms
        constitute electronic communications. You consent to receive electronic
        communications, and you agree that all agreements, notices, disclosures,
        and other communications we provide to you electronically, via email and
        on the Services, satisfy any legal requirement that such communication
        be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES,
        CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF
        NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY
        US OR VIA THE SERVICES. You hereby waive any rights or requirements
        under any statutes, regulations, rules, ordinances, or other laws in any
        jurisdiction which require an original signature or delivery or
        retention of non-electronic records, or to payments or the granting of
        credits by any means other than electronic means.
      </p>

      <h2 className="legal-page__section-title">18. Miscellaneous</h2>
      <p>
        These Legal Terms and any policies or operating rules posted by us on
        the Services constitute the entire agreement and understanding between
        you and us. Our failure to exercise or enforce any right or provision of
        these Legal Terms shall not operate as a waiver of such right or
        provision. These Legal Terms operate to the fullest extent permissible
        by law. We may assign any or all of our rights and obligations to others
        at any time. We shall not be responsible or liable for any loss, damage,
        delay, or failure to act caused by any cause beyond our reasonable
        control. If any provision or part of a provision of these Legal Terms is
        determined to be unlawful, void, or unenforceable, that provision or
        part of the provision is deemed severable from these Legal Terms and
        does not affect the validity and enforceability of any remaining
        provisions. There is no joint venture, partnership, employment or agency
        relationship created between you and us as a result of these Legal Terms
        or use of the Services. You agree that these Legal Terms will not be
        construed against us by virtue of having drafted them. You hereby waive
        any and all defenses you may have based on the electronic form of these
        Legal Terms and the lack of signing by the parties hereto to execute
        these Legal Terms.
      </p>

      <h2 className="legal-page__section-title">19. Contact Us</h2>
      <p>
        In order to resolve a complaint regarding the Services or to receive
        further information regarding use of the Services, please contact us at:
      </p>
      <p>
        <a href="mailto:tazdecorcatholiccompany@gmail.com">
          tazdecorcatholiccompany@gmail.com
        </a>
      </p>

      <p className="legal-page__footer-note">
        This Terms and Conditions was created using Termly's Terms and
        Conditions Generator.
      </p>
    </div>
  );
};

export default TermsAndConditions;
