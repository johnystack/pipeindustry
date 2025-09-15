import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header'; // Directly import Header

const ContactUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header /> {/* Render Header directly */}
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Get in Touch with <span className="text-primary">PipIndustry</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            We're here to answer your questions, provide support, and help you achieve your investment goals.
          </p>
        </section>

        {/* Contact Information Section */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-6 shadow-md flex flex-col items-center justify-center">
              <Mail className="h-12 w-12 text-primary mb-4" />
              <CardHeader>
                <CardTitle className="text-2xl font-semibold mb-2">Email Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">For general inquiries and support.</p>
                <a href="mailto:pipindystry@gmail.com" className="text-lg font-medium text-blue-600 hover:underline">pipindystry@gmail.com</a>
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-md flex flex-col items-center justify-center">
              <Phone className="h-12 w-12 text-primary mb-4" />
              <CardHeader>
                <CardTitle className="text-2xl font-semibold mb-2">Call Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Connect with our support team.</p>
                <p className="text-lg font-medium text-muted-foreground">+1 (XXX) XXX-XXXX</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 shadow-md flex flex-col items-center justify-center">
              <MapPin className="h-12 w-12 text-primary mb-4" />
              <CardHeader>
                <CardTitle className="text-2xl font-semibold mb-2">Visit Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Our main office location.</p>
                <p className="text-lg font-medium text-muted-foreground">123 Investment Blvd, Suite 400, Financial City, FC 12345</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Form Placeholder */}
        <section className="mb-16">
          <Card className="w-full max-w-3xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-4xl font-bold mb-4">Send Us a Message</CardTitle>
              <CardDescription className="text-lg">Fill out the form below and we'll get back to you shortly.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for a contact form - you would integrate your form components here */}
              <div className="bg-muted p-8 rounded-md text-center text-muted-foreground">
                <p>Contact Form Placeholder</p>
                <p>Integrate your form components (Input, Textarea, Button) here.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-primary-foreground py-12 rounded-lg shadow-xl">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Your Investment Journey?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Our team is eager to assist you. Reach out today!
          </p>
          <Link to="/invest">
            <Button size="lg" className="text-lg px-10 py-4">Explore Investment Plans</Button>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default ContactUs;