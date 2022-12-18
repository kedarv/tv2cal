import React, { useState, useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import Accordion from 'react-bootstrap/Accordion';
import { API_BASE } from './utils';
import fetch from 'isomorphic-fetch';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';

function Dashboard({ lists }) {
  const [episodes, setEpisodes] = useState([]);

  const fetchLists = async () => {
    let accumulatedEpisodes = [];
    for (const list of lists) {
      const resp = await (await fetch(`${API_BASE}/list/${list['id']}`)).json();
      accumulatedEpisodes = accumulatedEpisodes.concat(resp);
    }
    setEpisodes(accumulatedEpisodes);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  return (
    <Card className="mt-2">
      <Card.Body>
        <Card.Title>Watch List</Card.Title>
        <Accordion>
          {lists.map((list) => {
            return JSON.parse(list['shows']).map((show) => {
              return (
                <Accordion.Item eventKey={show['id']} key={show['show_id']}>
                  <Accordion.Header>{show['label']}</Accordion.Header>
                  <Accordion.Body>
                    <ListGroup>
                      mark entire show as watched
                      {episodes
                        .filter((episode) => episode.show_id == show['id'])
                        .sort(
                          (episodeA, episodeB) =>
                            episodeA.season_number - episodeB.season_number ||
                            episodeA.episode_number - episodeB.episode_number
                        )
                        .map((e) => (
                          <ListGroup.Item
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                          >
                            <Form.Check type="checkbox" />
                            <div className="ms-2 me-auto">
                              <div className="fw-bold">
                                {' '}
                                s{e.season_number}e{e.episode_number}
                              </div>
                              {e.name}
                            </div>
                          </ListGroup.Item>
                        ))}
                    </ListGroup>
                  </Accordion.Body>
                </Accordion.Item>
              );
            });
          })}
        </Accordion>
      </Card.Body>
    </Card>
  );
}

export default Dashboard;
