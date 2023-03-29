import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { NFTStorage, File } from 'nft.storage'

import Spinner from 'react-bootstrap/Spinner';


//abis
import MyNFTAbi from './contracts/MyNFT.json'
import MyNFTAddress from './contracts/MyNFT-address.json'

// Components
import Marketplace from './components/marketplace.js';
import Home from './components/Home.js';

const ERC20_DECIMALS = 18;
var loadingText;

function App() {

  const [contract, setContract] = useState(null);
  const [address, setAddress] = useState(null);
  const [kit, setKit] = useState(null);
  const [cUSDBalance, setcUSDBalance] = useState(0);
  const [arts, setArts] = useState([])
  const [isLoading, setIsLoading] = useState(false);
 

  const connectToWallet = async () => {
    if (window.celo) {
      try {
        await window.celo.enable();
        const web3 = new Web3(window.celo);
        let kit = newKitFromWeb3(web3);

        const accounts = await kit.web3.eth.getAccounts();
        const user_address = accounts[0];
        kit.defaultAccount = user_address;

        await setAddress(user_address);
        await setKit(kit);
      } catch (error) {
        console.log(error);
      }
    } else {
      alert("Error Occurred");
    }
  };

  const getBalance = useCallback(async () => {
    try {
      const balance = await kit.getTotalBalance(address);
      const USDBalance = balance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);

      const contract = new kit.web3.eth.Contract(MyNFTAbi.abi, MyNFTAddress.MyNFT);
      setContract(contract);
      setcUSDBalance(USDBalance);
      
    } catch (error) {
      console.log(error);
    }
  }, [address, kit]);



  const createAndMint = async (_name, _description) => {

    if (_name === "" || _description === "") {
      window.alert("Please provide a name and description")
      return
    }

      try{
        setIsLoading(true);
        loadingText = "Creating and Minting Art......" 
    // Call AI API to generate a image based on description
    const imageData = await createImage(_name, _description);
 
    if(imageData){
    const url = await uploadToIpfs(imageData, _name, _description)
    console.log(url);

    //Mint NFT
    await mintImage(url);
    }

    getArts()
  }catch (error) {
    console.error("Error creating and minting NFT:", error);
  } finally {
    setIsLoading(false);
  }
};



const createImage = async (_name, _description) => {
  //  setMessage("Generating Image...")

    // You can replace this with different model API's
    const URL = `https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2`

    // Send the request
    const response = await axios({
      url: URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        inputs: _description, options: { wait_for_model: true },
      }),
      responseType: 'arraybuffer',
    })

    const data = response.data
   // step 2
    return data
  }

  const mintImage = async (tokenURI) => {

     await contract.methods.mintArt(tokenURI)
    .send({ from: address });
  }

  

const getArts = async () => {
  try {
    const nfts = [];
    const nftsLength = await contract.methods
      .getAllArts()
      .call();
    // contract starts minting from index 1
    for (let i = 1; i <= Number(nftsLength); i++) {
      const nft = new Promise(async (resolve) => {
        const art = await contract.methods
          .getArt(i)
          .call();
        const res = await contract.methods.tokenURI(i).call();
        const meta = await fetchNftMeta(res);
        resolve({
          index: i,
          tokenId: art.tokenId,
          price: art.price,
          seller: art.seller,
          forSale: art.forSale,
          name: meta.data.name,
          image: meta.data.image,
          description: meta.data.description,
        });
      });
      nfts.push(nft);
    }
    const _nfts = await Promise.all(nfts);
    setArts(_nfts);
  } catch (e) {
    console.log({ e });
  }
};

const fetchNftMeta = async (ipfsUrl) => {
  try {
    if(!ipfsUrl) return null;
    const meta = await axios.get(ipfsUrl);
return meta;
  } catch (e) {
    console.log({ e });
  }
};

const uploadToIpfs = async (imageData, _name, _description) => {

  // Create instance to NFT.Storage
  const nftstorage = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_API_KEY })

  // Send request to store image
  const { ipnft } = await nftstorage.store({
    image: new File([imageData], "image.jpeg", { type: "image/jpeg" }),
    name: _name,
    description: _description,
  })

  // Save the URL
  const url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`
  return url;
};

const sellArt = async (_tokenId, _price) => {

  try {
    setIsLoading(true);
    loadingText = "Setting price to sell Art......";
    await contract.methods
      .sellArt(_tokenId, _price)
      .send({ from: address });
    getArts();
  } catch (error) {
    alert(error);
  }finally {
    setIsLoading(false);
  }
};

const cancel = async (_tokenId) => {
  try {
    setIsLoading(true)
    loadingText="Canceling Art Sale........";
    await contract.methods
      .cancelArtSale(_tokenId)
      .send({ from: address });
    getArts();
  } catch (error) {
    alert(error);
  }finally {
    setIsLoading(false);
  }
};

const buyArt = async (tokenId) => {
  
      try {
       setIsLoading(true);
       loadingText = "Buying and transfering NFT Art.....";
        const listing = await contract.methods
          .getArt(tokenId)
          .call();
        await contract.methods
          .buyArt(tokenId)
          .send({ from: address, value: listing.price });
      } catch (error) {
        console.log({ error });
      }finally {
        setIsLoading(false);
      }
  
};



  useEffect(() => {
   connectToWallet();

  }, [])

  useEffect(() => {
    if (kit && address) {
      getBalance();
    }
  }, [kit, address, getBalance]);

  useEffect(() => {
    if (contract) {
      getArts(contract);
    }
  }, [contract]);

  return (
    <div className='App'>
       {isLoading && (
      <div className='spinner-container'>
        <Spinner animation='border' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </Spinner>
        <p className='spinner-text'>{loadingText}</p>
      </div>
    )}
      <Home cUSDBalance={cUSDBalance} createAndMint={createAndMint} />
      <Marketplace
        arts={arts}
        sellArt={sellArt}
        cancel={cancel}
        buyArt={buyArt}
        walletAddress={address}
      />
    </div>
  );
}

export default App;