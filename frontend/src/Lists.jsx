import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Dashboard from './Dashboard';
import { useAuth } from './AuthProvider';
import ListItem from './ListItem';

function Lists({ lists, handleEdit, handleDelete }) {
  const { email } = useAuth();
  const ownsList = email && !!lists.authedLists.length;
  const getKeys = () => {
    if (ownsList) {
      return ['authedLists', 'unauthedLists'];
    }
    return ['unauthedLists'];
  };

  const offset = ownsList ? 0 : 4;
  return (
    <Container fluid className="mt-3">
      <Row>
        {email && ownsList && (
          <Col md={{ span: 8 }}>
            <h1 className="h4">watch list</h1>
            <Dashboard lists={lists.authedLists} />
          </Col>
        )}
        <Col md={{ span: 4, offset }}>
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
