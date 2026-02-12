import type { Metadata } from "next";
import { legalConfig } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Legal Notice - Open Duolingo",
  description: "Legal notice and publisher information for Open Duolingo",
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
        <p className="text-xs text-muted italic">
          If you are self-hosting this application, replace the placeholders
          above with your own information.
        </p>
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

      {/* Intellectual Property */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Intellectual Property
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Open Duolingo is an open-source project. The source code is available
          under the terms of its open-source license. The name
          &quot;Duolingo&quot; is a registered trademark of Duolingo, Inc. This
          project is not affiliated with, endorsed by, or sponsored by Duolingo,
          Inc.
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
