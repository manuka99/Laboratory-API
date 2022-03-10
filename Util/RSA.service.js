const { pki, md, util } = require("node-forge");

const PUBLIC_KEY_HEADER = "-----BEGIN PUBLIC KEY-----";
const PUBLIC_KEY_FOOTER = "-----END PUBLIC KEY-----";
const PRIVATE_KEY_HEADER = "-----BEGIN RSA PRIVATE KEY-----";
const PRIVATE_KEY_FOOTER = "-----END RSA PRIVATE KEY-----";

exports.GenerateKeypair = async () => {
  return new Promise((resolve) => {
    var rsa = pki.rsa;
    rsa.generateKeyPair({ bits: 1024, workers: 2 }, function (err, keypair) {
      if (err) resolve(null);
      else {
        var pubKeyPEM = pki.publicKeyToPem(keypair.publicKey);
        var privKeyPEM = pki.privateKeyToPem(keypair.privateKey);
        const publicKey = pubKeyPEM
          .replace(PUBLIC_KEY_HEADER, "")
          .replace(PUBLIC_KEY_FOOTER, "")
          .trim();
        const privateKey = privKeyPEM
          .replace(PRIVATE_KEY_HEADER, "")
          .replace(PRIVATE_KEY_FOOTER, "")
          .trim();
        resolve({
          publicKey,
          privateKey,
        });
      }
    });
  });
};

exports.KeypairFromRawPrivate = (rawPrivateKey) => {
  try {
    var privateKey = pki.privateKeyFromPem(
      PRIVATE_KEY_HEADER + rawPrivateKey + PRIVATE_KEY_FOOTER
    );
    var publicKey = pki.rsa.setPublicKey(privateKey.n, privateKey.e);
    return {
      publicKey,
      privateKey,
    };
  } catch (error) {
    return null;
  }
};

exports.PublicKeyFromRawPublic = (rawPublicKey) => {
  try {
    var publicKey = pki.publicKeyFromPem(
      PUBLIC_KEY_HEADER + rawPublicKey + PUBLIC_KEY_FOOTER
    );
    return publicKey;
  } catch (error) {
    return null;
  }
};

exports.IsValidPublicKeyForPrivateKey = (
  rawPrivateKey,
  rawComparePublicKey
) => {
  try {
    const PemKeys = this.KeypairFromRawPrivate(rawPrivateKey);
    var comparePublicKey = pki.publicKeyFromPem(
      PUBLIC_KEY_HEADER + rawComparePublicKey + PUBLIC_KEY_FOOTER
    );
    return (
      PemKeys.publicKey.n.compareTo(comparePublicKey.n) == 0 &&
      PemKeys.publicKey.e.compareTo(comparePublicKey.e) == 0
    );
  } catch (error) {
    return false;
  }
};

exports.EncryptWithRawPublicKey = (rawPublicKey, rawData) => {
  try {
    const publicKey = this.PublicKeyFromRawPublic(rawPublicKey);
    var encrypted = publicKey.encrypt(
      util.encodeUtf8(rawData),
      "RSAES-PKCS1-V1_5"
    );
    var encryptedBase64 = util.encode64(encrypted);
    return encryptedBase64;
  } catch (error) {
    return null;
  }
};

exports.DecryptWithRawPrivateKey = (rawPrivateKey, encryptedBase64) => {
  try {
    const { privateKey } = this.KeypairFromRawPrivate(rawPrivateKey);
    var decrypted = privateKey.decrypt(
      util.decode64(encryptedBase64),
      "RSAES-PKCS1-V1_5"
    );
    return decrypted;
  } catch (error) {
    return null;
  }
};

// (async () => {
//   // Create
//   const keypair = await GenerateKeypair();
//   if (!keypair) return console.log("Could not create keypair");
//   console.log("PubKeyPEM", keypair.publicKey);
//   console.log("\nPrivKeyPEM", keypair.privateKey);

//   // import
//   const PemKeys = KeypairFromRawPrivate(keypair.privateKey);
//   if (!PemKeys) return console.log("Could not get keypair");

//   const publicKey = PublicKeyFromPublicPem(keypair.publicKey);
//   if (!PemKeys) return console.log("Could not get public key");

//   console.log("\nPublicKey", publicKey.e);

//   const isVerified = IsValidPublicKeyForPrivateKey(
//     keypair.privateKey,
//     keypair.publicKey
//   );

//   console.log("isVerified", isVerified);

//   // sign
//   const unSignedData =
//     "SCIYNJ6EADOYJX7655JEOLYQ6EEMQFTSNGTECZNFFAPMQX77PGGQJXR3";

//   var encrypted = PemKeys.publicKey.encrypt(
//     util.encodeUtf8(unSignedData),
//     "RSAES-PKCS1-V1_5"
//   );

//   var encryptedBase64 = util.encode64(encrypted);

//   console.log("\n\nEncrypted", encryptedBase64);

//   var decrypted = PemKeys.privateKey.decrypt(
//     util.decode64(encryptedBase64),
//     "RSAES-PKCS1-V1_5"
//   );
//   console.log("\n\nDecrypted", decrypted);
// })();
