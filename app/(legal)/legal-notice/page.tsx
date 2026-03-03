import type { Metadata } from "next";
import { legalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Legal Notice - Qwizy!",
  description: "Legal notice and publisher information for Qwizy!",
};

export default function LegalNoticePage() {
  return (
    <>
      <header>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Legal Notice
        </h1>
        <p className="text-muted">Last updated: {legalConfig.lastUpdated}</p>
      </header>

      {/* Publisher Information */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Publisher Information
        </h2>
        <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
          <p>
            <span className="font-medium text-foreground">Publisher:</span>{" "}
            <span className="text-warning">{legalConfig.publisherName}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Address:</span>{" "}
            <span className="text-warning">{legalConfig.publisherAddress}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Email:</span>{" "}
            <span className="text-warning">{legalConfig.publisherEmail}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Phone:</span>{" "}
            <span className="text-warning">{legalConfig.publisherPhone}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">
              Publication Director:
            </span>{" "}
            <span className="text-warning">{legalConfig.publisherDirector}</span>
          </p>
        </div>
        {/* <p className="text-xs text-muted italic">
          If you are self-hosting this application, replace the placeholders
          above with your own information.
        </p> */}
      </section>

      {/* Hosting Provider */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Hosting Provider
        </h2>
        <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
          <p>
            <span className="font-medium text-foreground">Host:</span>{" "}
            <span className="text-warning">{legalConfig.hostName}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Address:</span>{" "}
            <span className="text-warning">{legalConfig.hostAddress}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Website:</span>{" "}
            <span className="text-warning">{legalConfig.hostWebsite}</span>
          </p>
        </div>
      </section>

      {/* Database Hosting Provider */}
      {legalConfig.dbHostName && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            Database Hosting Provider
          </h2>
          <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
            <p>
              <span className="font-medium text-foreground">Host:</span>{" "}
              <span className="text-warning">{legalConfig.dbHostName}</span>
            </p>
            {legalConfig.dbHostAddress && (
              <p>
                <span className="font-medium text-foreground">Address:</span>{" "}
                <span className="text-warning">
                  {legalConfig.dbHostAddress}
                </span>
              </p>
            )}
            {legalConfig.dbHostWebsite && (
              <p>
                <span className="font-medium text-foreground">Website:</span>{" "}
                <span className="text-warning">
                  {legalConfig.dbHostWebsite}
                </span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* Intellectual Property */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Intellectual Property
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          <span className="font-logo">Qwizy!</span> is an open-source project.
          The source code is available on{" "}
          <a
            href="https://github.com/soleilvermeil/qwizy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover underline"
          >
            GitHub
          </a>{" "}
          under the terms of its open-source license.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          The structure, layout, and original content of this website are
          protected by intellectual property laws. Any reproduction,
          representation, modification, or adaptation of any part of this
          website without prior written permission is prohibited, except as
          permitted by the applicable open-source license.
        </p>
      </section>

      {/* Liability */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Liability</h2>
        <p className="text-muted-foreground leading-relaxed">
          The publisher strives to provide accurate and up-to-date information
          on this website. However, the publisher cannot guarantee the accuracy,
          completeness, or timeliness of the information provided. The publisher
          shall not be held liable for any direct or indirect damages resulting
          from the use of this website or the inability to access it.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          This application is provided &quot;as is&quot;, without warranty of
          any kind. Use of this service is at the user&apos;s own risk.
        </p>
      </section>

      {/* Educational Use */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Educational Use
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          This service may be used in an educational context. When used by
          educational institutions, the instance administrator is the data
          controller and is responsible for:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            Obtaining appropriate consent for the creation and management of
            student accounts, in accordance with applicable data protection
            regulations (including GDPR Art. 8 regarding conditions applicable
            to child&apos;s consent)
          </li>
          <li>
            Informing students (and, where applicable, their parents or legal
            guardians) about the collection and processing of their personal
            data
          </li>
          <li>
            Ensuring that the use of the service complies with all applicable
            educational and data protection regulations in their jurisdiction
          </li>
        </ul>
      </section>

      {/* Applicable Law */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Applicable Law
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          This legal notice is governed by the laws of the European Union and
          the applicable national laws of the country in which the publisher is
          established. Any dispute arising from the use of this website shall be
          subject to the exclusive jurisdiction of the competent courts.
        </p>
      </section>
    </>
  );
}
