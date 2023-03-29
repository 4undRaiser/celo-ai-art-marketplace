import React from "react";
import { useState } from "react";
import { Card, Badge, Col, Stack, Row } from "react-bootstrap";

const Marketplace = (props) => {
  const [prices, setPrices] = useState([]);

  function convertIpfsUrl(ipfsUrl) {
    const ipfsGateway = 'https://ipfs.io/ipfs/';
    return ipfsUrl.replace('ipfs://', ipfsGateway);
  }
  return (
    <Row xs={1} md={3} className="g-4">
      {props.arts.map((art) => (
        <Col key={art.index}>
          <Card className="h-100">
            <Card.Header>
              <Stack direction="horizontal" gap={2}>
                <Badge bg="secondary" className="ms-auto">
                  {art.index} ID
                </Badge>

                <Badge bg="secondary" className="ms-auto">
                  {art.price} Celo
                </Badge>
              </Stack>
            </Card.Header>

            <div className=" ratio ratio-4x3">
              <img
                src={convertIpfsUrl(art.image)}
                alt={art.name}
                style={{ objectFit: "cover" }}
              />
            </div>

            <Card.Body className="d-flex  flex-column text-center">
              <Card.Title className="flex-grow-1">
                {art.name}
              </Card.Title>

              <Card.Text className="flex-grow-1">
                {art.description}
              </Card.Text>

              { art.seller === props.walletAddress && (
              <form>
              <div class="form-r">
                <input
                  type="number"
                  class="form-control mt-3"
                  value={prices[art.index] || ""}
                  onChange={(e) => {
                    const newPrices = [...prices];
                    newPrices[art.index] = e.target.value;
                    setPrices(newPrices);
                  }}
                  placeholder="enter price"
                />
                <button
                  type="button"
                  onClick={() => props.sellArt(art.tokenId, prices[art.index])}
                  class="btn btn-dark mt-1"
                >
                 Sell Art
                </button>
              </div>
            </form>
              )}

             { art.seller === props.walletAddress && art.forSale === true && (
              <button
                    type="button"
                    onClick={() => props.cancel(art.tokenId)}
                    class="btn btn-dark mt-1"
                  >
                   Cancel Sale
                  </button>
             )}


            {art.forSale === true && art.seller !== props.walletAddress && (
            <div className="d-flex m-2 justify-content-center">
              <button
                className="btn btn-primary"
                onClick={() => props.buyArt(art.tokenId)}
              >
                Buy this Art
              </button>
            </div>
          )}

          {art.forSale === false && props.walletAddress !== art.seller && (
             <Badge bg="secondary" className="ms-auto">
             Not for sale
           </Badge>
          )}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};


export default Marketplace;