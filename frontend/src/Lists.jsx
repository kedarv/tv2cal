import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import dayjs from 'dayjs';
import { API_BASE } from './utils';

function Lists({ lists, handleEdit, handleDelete }) {
  return (
    <Container fluid className="mt-3">
      <Row>
        <Col md={{ span: 4, offset: 4 }}>
          {lists.map((list) => {
            return (
              <Card key={list['name']} className="mt-2">
                <Card.Body>
                  <Card.Title>{list['name']}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    <a
                      href={`https://calendar.google.com/calendar/r?cid=webcal://${API_BASE.replace(
                        /^https?\:\/\//i,
                        ''
                      )}/cal/${list['id']}`}
                      className="text-reset text-decoration-none"
                    >
                      🗓️ Add to Google Calendar
                    </a>
                  </Card.Subtitle>
                  <Card.Text>
                    {JSON.parse(list['shows'])
                      .map((item) => item['label'])
                      .join(', ')}
                  </Card.Text>
                </Card.Body>
                <Card.Footer>
                  <small className="text-muted">
                    Last updated {dayjs(list['updated_at']).format('MMMM D, YYYY')} -{' '}
                    <a
                      href="#"
                      role="button"
                      className="text-reset text-decoration-none"
                      onClick={(e) => handleEdit(e, list)}
                    >
                      [edit
                    </a>
                    &nbsp;|&nbsp;
                    <a
                      href="#"
                      role="button"
                      className="text-reset text-decoration-none"
                      onClick={(e) => handleDelete(e, list)}
                    >
                      delete
                    </a>
                    ]
                  </small>
                </Card.Footer>
              </Card>
            );
          })}
        </Col>
      </Row>
    </Container>
  );
}

export default Lists;
