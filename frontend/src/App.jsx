import React, { useCallback, useState, useEffect, useRef } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import fetch from 'isomorphic-fetch';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Card from 'react-bootstrap/Card';
import dayjs from 'dayjs';

const API_BASE = import.meta.env.VITE_API_HOST;

async function makeAndHandleRequest(query) {
  const resp = await (await fetch(`${API_BASE}/search?search=${query}`)).json();
  return resp.map((i) => ({
    id: i.id,
    label: `${i.name} (${dayjs(i.first_air_date).format("YYYY")})`,
  }));
}

function App() {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [value, setValue] = useState("");
  const [email, setEmail] = useState("");
  const [alertText, setAlertText] = useState("");
  const [lists, setLists] = useState([]);
  const typeaheadRef = useRef();
  const [isListLoaded, setIsListLoaded] = useState(false);

  const fetchLists = async () => {
    const resp = await (await fetch(`${API_BASE}/lists`)).json();
    setIsListLoaded(true);
    setLists(resp);
  }

  useEffect(() => {
    fetchLists();
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsButtonDisabled(true);
    const resp = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: value, shows: selected, email: email })
    });
    if (resp.status === 200) {
      setValue("");
      setQuery("");
      setSelected([]);
      typeaheadRef.current?.clear();
      setAlertText("List Created");
      setShow(true);
      fetchLists();
      setEmail("");
      setIsButtonDisabled(false);
    } else {
      setShow(true);
      setIsButtonDisabled(false);
      setAlertText(`Something went wrong: ${(await resp.json())['message']}`);
    }
  }

  const handleInputChange = (q) => {
    setQuery(q);
  };

  // `handleInputChange` updates state and triggers a re-render, so
  // use `useCallback` to prevent the debounced search handler from
  // being cancelled.
  const handleSearch = useCallback((q) => {
    setIsLoading(true);
    makeAndHandleRequest(q).then((resp) => {
      setIsLoading(false);
      setOptions(resp);
    });
  }, []);

  return (
    <>
      <ToastContainer position="top-center" className="p-3" style={{ "zIndex": 1 }}>
        <Toast onClose={() => setShow(false)} show={show} delay={3000} autohide>
          <Toast.Header>
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body>{alertText}</Toast.Body>
        </Toast>
      </ToastContainer>
      <Container fluid className="mt-3">
        <Row>
          <Col md={{ span: 4, offset: 4 }}>
            <h1 className="h3">tv2cal <small className="text-muted">(track your shows in your calendar)</small></h1>
            <Card>
              <Card.Body>
                <Form onSubmit={onSubmit}>
                  <Form.Group className="mb-3" controlId="formListName">
                    <Form.Label>List Name</Form.Label>
                    <Form.Control type="text" placeholder="Enter List Name" value={value} onChange={e => setValue(e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="text" placeholder="Enter Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <Form.Text className="text-muted">
                      You'll need to remember this to edit your list in the future
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="formEmail">
                    <AsyncTypeahead
                      id="async-search"
                      isLoading={isLoading}
                      onInputChange={handleInputChange}
                      onSearch={handleSearch}
                      multiple
                      options={options}
                      placeholder="Search for a TV Show"
                      renderMenuItemChildren={(option) => (
                        <div key={option.id}>
                          <span>{option.label}</span>
                        </div>
                      )}
                      useCache={true}
                      caseSensitive={false}
                      onChange={(selected) => setSelected(selected)}
                      ref={typeaheadRef}
                    />
                    <Form.Text className="text-muted">
                      Click the search result or use the enter key to add the result to your list
                    </Form.Text>
                  </Form.Group>
                  <Button variant="primary" type="submit" className="mt-3" disabled={isButtonDisabled}>
                    {isButtonDisabled ? 'Working...' : 'Submit List'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Container fluid className="mt-3">
        <Row>
          <Col md={{ span: 4, offset: 4 }}>
            {lists.map(list => {
              return (
                <Card key={list['name']} className="mt-2">
                  <Card.Body>
                    <Card.Title>{list['name']}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted"><a href={`https://calendar.google.com/calendar/r?cid=webcal://${API_BASE.replace(/^https?\:\/\//i, "")}/cal/${list['id']}`} className="text-reset text-decoration-none">🗓️ Add to Google Calendar</a></Card.Subtitle>
                    <Card.Text>
                      {JSON.parse(list['shows']).map(item => item['label']).join(', ')}
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <small className="text-muted">Last updated {dayjs(list['updated_at']).format("MMMM D, YYYY")} - edit</small>
                  </Card.Footer>
                </Card>
              )
            })}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
