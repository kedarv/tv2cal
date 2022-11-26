import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import dayjs from 'dayjs';
import { API_BASE } from './utils';
import { useAuth } from './AuthProvider';
import ListItem from './ListItem';

function Lists({ lists, handleEdit, handleDelete }) {
  const { email } = useAuth();
  const getKeys = () => {
    if (email && lists['authedLists'].length) {
      return ['authedLists', 'unauthedLists'];
    }
    return ['unauthedLists'];
  };

  return (
    <Container fluid className="mt-3">
      <Row>
        <Col md={{ span: 4, offset: 4 }}>
          {getKeys().map((key) => {
            return (
              <span key={key}>
                {' '}
                <div className={key === 'unauthedLists' ? 'mt-3' : undefined}>
                  <h1 className="h4">{key === 'authedLists' ? 'yours' : 'community lists'}</h1>
                </div>
                {lists[key].map((listItem) => (
                  <ListItem
                    key={listItem['id']}
                    handleDelete={handleDelete}
                    handleEdit={handleEdit}
                    listItem={listItem}
                    authed={key === 'authedLists'}
                  />
                ))}
              </span>
            );
          })}
        </Col>
      </Row>
    </Container>
  );
}

export default Lists;
