import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { API_BASE } from './utils';
import { useAuth } from './AuthProvider';

function LoginForm() {
  const [email, setEmail] = useState('');
  const { user, login } = useAuth();
  const onSubmit = async (e) => {
    e.preventDefault();
    login(email);
  };

  return (
    <Container fluid className="mt-3">
      <Row>
        <Col md={{ span: 4, offset: 4 }}>
          <Card>
            <Card.Body>
              <h5>Authenticate</h5>
              <Form onSubmit={onSubmit}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    You'll need to remember this to manage your list
                  </Form.Text>
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-1">
                  Submit
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginForm;
