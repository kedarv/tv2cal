import React, { useCallback, useState, useRef } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import fetch from 'isomorphic-fetch';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Card from 'react-bootstrap/Card';
import dayjs from 'dayjs';
import { API_BASE } from './utils';
import toast from 'react-hot-toast';
import { useAuth } from './AuthProvider';

async function makeAndHandleRequest(query) {
  const resp = await (await fetch(`${API_BASE}/search?search=${query}`)).json();
  return resp.map((i) => ({
    id: i.id,
    label: `${i.name} (${dayjs(i.first_air_date).format('YYYY')})`
  }));
}

function ListForm({ list, fetchLists, standaloneForm }) {
  const { email } = useAuth();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState((list && JSON.parse(list.shows)) || []);
  const [query, setQuery] = useState('');
  const [value, setValue] = useState(list?.name || '');
  const typeaheadRef = useRef();

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsButtonDisabled(true);
    let resp;
    if (list) {
      resp = await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: value, shows: selected, email: email, id: list['id'] })
      });
    } else {
      resp = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: value, shows: selected, email: email })
      });
    }
    if (resp.status === 200) {
      setValue('');
      setQuery('');
      setSelected([]);
      typeaheadRef.current?.clear();
      toast.success(list ? 'List Updated' : 'List Created');
      fetchLists(email);
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(false);
      toast.error(`Something went wrong: ${(await resp.json())['message']}`);
    }
  };

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

  const innerForm = (
    <Form onSubmit={onSubmit}>
      <Form.Group className="mb-3" controlId="formListName">
        <Form.Label>List Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter List Name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="async-search">
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
          selected={selected}
          ref={typeaheadRef}
        />
        <Form.Text className="text-muted">
          Click the search result or use enter key to add results
        </Form.Text>
      </Form.Group>
      <Button variant="primary" type="submit" className="mt-1" disabled={isButtonDisabled}>
        {isButtonDisabled ? 'Working...' : 'Submit List'}
      </Button>
    </Form>
  );

  return (
    <>
      {standaloneForm ? (
        innerForm
      ) : (
        <Container fluid>
          <Row>
            <Col md={{ span: 4, offset: 4 }}>
              <Card>
                <Card.Body>{innerForm}</Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      )}
    </>
  );
}

export default ListForm;
