import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-primary">
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              Your privacy is important to us. It is PipIndustry's policy to
              respect your privacy regarding any information we may collect from
              you across our website, https://pipindustry.com, and other sites
              we own and operate.
            </p>

            <h2>1. Information we collect</h2>
            <p>
              We only ask for personal information when we truly need it to
              provide a service to you. We collect it by fair and lawful means,
              with your knowledge and consent. We also let you know why we’re
              collecting it and how it will be used.
            </p>

            <h2>2. How we use your information</h2>
            <p>
              We use the information we collect in various ways, including to:
              Provide, operate, and maintain our website; Improve, personalize,
              and expand our website; Understand and analyze how you use our
              website; Develop new products, services, features, and
              functionality; Communicate with you, either directly or through
              one of our partners, including for customer service, to provide
              you with updates and other information relating to the website,
              and for marketing and promotional purposes; Send you emails; Find
              and prevent fraud.
            </p>

            <h2>3. Log Files</h2>
            <p>
              PipIndustry follows a standard procedure of using log files. These
              files log visitors when they visit websites. All hosting
              companies do this and a part of hosting services' analytics. The
              information collected by log files include internet protocol (IP)
              addresses, browser type, Internet Service Provider (ISP), date
              and time stamp, referring/exit pages, and possibly the number of
              clicks. These are not linked to any information that is
              personally identifiable. The purpose of the information is for
              analyzing trends, administering the site, tracking users'
              movement on the website, and gathering demographic information.
            </p>

            <h2>4. Cookies and Web Beacons</h2>
            <p>
              Like any other website, PipIndustry uses 'cookies'. These cookies
              are used to store information including visitors' preferences,
              and the pages on the website that the visitor accessed or
              visited. The information is used to optimize the users'
              experience by customizing our web page content based on
              visitors' browser type and/or other information.
            </p>

            <h2>5. CCPA Privacy Rights (Do Not Sell My Personal Information)</h2>
            <p>
              Under the CCPA, among other rights, California consumers have the
              right to: Request that a business that collects a consumer's
              personal data disclose the categories and specific pieces of
              personal data that a business has collected about consumers.
              Request that a business delete any personal data about the
              consumer that a business has collected. Request that a business
              that sells a consumer's personal data, not sell the consumer's
              personal data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
