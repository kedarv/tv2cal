import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import { API_BASE } from './utils';
import dayjs from 'dayjs';

function ListItem({ listItem, handleDelete, handleEdit, authed }) {
  return (
    <Card key={listItem['name']} className="mt-2">
      <Card.Body>
        <Card.Title>{listItem['name']}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          <a
            href={`https://calendar.google.com/calendar/r?cid=webcal://${API_BASE.replace(
              /^https?\:\/\//i,
              ''
            )}/cal/${listItem['id']}`}
            className="text-reset text-decoration-none"
          >
            🗓️ Add to Google Calendar
          </a>
        </Card.Subtitle>
        <Card.Text>
          {JSON.parse(listItem['shows'])
            .map((item) => item['label'])
            .join(', ')}
        </Card.Text>
      </Card.Body>
      <Card.Footer>
        <small className="text-muted">
          Updated {dayjs(listItem['updatedAt']).format('MMMM D, YYYY')}
          {authed && (
            <>
              {' '}
              -{' '}
              <a
                href="#"
                role="button"
                className="text-reset text-decoration-none"
                onClick={(e) => handleEdit(e, listItem)}
              >
                [edit
              </a>
              &nbsp;|&nbsp;
              <a
                href="#"
                role="button"
                className="text-reset text-decoration-none"
                onClick={(e) => handleDelete(e, listItem)}
              >
                delete
              </a>
              ]
            </>
          )}
        </small>
      </Card.Footer>
    </Card>
  );
}

export default ListItem;
