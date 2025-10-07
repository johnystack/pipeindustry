import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-primary">
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              Welcome to PipIndustry! These terms and conditions outline the rules
              and regulations for the use of PipIndustry's Website, located at
              pipindustry.com.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing this website, we assume you accept these terms and
              conditions. Do not continue to use PipIndustry if you do not agree
              to take all of the terms and conditions stated on this page.
            </p>

            <h2>2. License</h2>
            <p>
              Unless otherwise stated, PipIndustry and/or its licensors own the
              intellectual property rights for all material on PipIndustry. All
              intellectual property rights are reserved. You may access this
              from PipIndustry for your own personal use subjected to
              restrictions set in these terms and conditions.
            </p>

            <h2>3. User Comments</h2>
            <p>
              This Agreement shall begin on the date hereof. Certain parts of
              this website offer an opportunity for users to post and exchange
              opinions and information in certain areas of the website.
              PipIndustry does not filter, edit, publish or review Comments
              prior to their presence on the website. Comments do not reflect
              the views and opinions of PipIndustry,its agents and/or
              affiliates. Comments reflect the views and opinions of the person
              who post their views and opinions.
            </p>

            <h2>4. Hyperlinking to our Content</h2>
            <p>
              The following organizations may link to our Website without prior
              written approval: Government agencies; Search engines; News
              organizations; Online directory distributors may link to our
              Website in the same manner as they hyperlink to the Websites of
              other listed businesses.
            </p>

            <h2>5. Disclaimer</h2>
            <p>
              To the maximum extent permitted by applicable law, we exclude all
              representations, warranties and conditions relating to our
              website and the use of this website. Nothing in this disclaimer
              will: limit or exclude our or your liability for death or
              personal injury; limit or exclude our or your liability for fraud
              or fraudulent misrepresentation; limit any of our or your
-             liabilities in any way that is not permitted under applicable
-             law; or exclude any of our or your liabilities that may not be
-             excluded under applicable law.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
