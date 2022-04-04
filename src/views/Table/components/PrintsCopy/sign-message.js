import qz from "qz-tray";
/*
 * JavaScript client-side example using jsrsasign
 */

// #########################################################
// #             WARNING   WARNING   WARNING               #
// #########################################################
// #                                                       #
// # This file is intended for demonstration purposes      #
// # only.                                                 #
// #                                                       #
// # It is the SOLE responsibility of YOU, the programmer  #
// # to prevent against unauthorized access to any signing #
// # functions.                                            #
// #                                                       #
// # Organizations that do not protect against un-         #
// # authorized signing will be black-listed to prevent    #
// # software piracy.                                      #
// #                                                       #
// # -QZ Industries, LLC                                   #
// #                                                       #
// #########################################################

/**
 * Depends:
 *     - jsrsasign-latest-all-min.js
 *     - qz-tray.js
 *
 * Steps:
 *
 *     1. Include jsrsasign 8.0.4 into your web page
 *        <script src="https://cdn.rawgit.com/kjur/jsrsasign/c057d3447b194fa0a3fdcea110579454898e093d/jsrsasign-all-min.js"></script>
 *
 *     2. Update the privateKey below with contents from private-key.pem
 *
 *     3. Include this script into your web page
 *        <script src="path/to/sign-message.js"></script>
 *
 *     4. Remove or comment out any other references to "setSignaturePromise"
 */
var privateKey =
  "-----BEGIN PRIVATE KEY-----MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCYt7GW9zqci1txnBIww953de5VSpmovUrCM7nWGSXG6jq00L7PWbvcjIc3+Iorvm27dMZBrRtuM2jIaqVVLPsg6T3dDRrRd8Ez+Sqiyu/IbVX3KP6R2CJm6qAe9f6qD9T5R5v5W0Ublhz0YM5gQLT4YPSMstP4SUfNhmMiAqJzeeb2FNcN8usj7CBXGtaEk0T1Y5jcRgDsN9+dCdDIKPnF9hEaeCGgDTSpfbivAsDByZ3fjgmQ1+2IyUzXvNS8QdX66ift6Ox/oR7x0iohMQ6mdqjRBGdMzJ+eLMKUcKkllU8rkBSyXaL21gG6GN63yxXX/q1T7gzU/ZXJAQf0Pvm5AgMBAAECggEAAJpXPwOmy9vdSCC2VF80Yc4Zp/6xbKbWDiSp+7m4Ci9q4ynnGonN02HYirZMv4q2Fr0wDa3fMhNablHrQtLYqUFgEav1zCsmYsjdm/L3ZdGjR94io1gb0NwL0DqtVYXjU9Pn3mdRKbOKyN7lEODC6u9npvKk4jtroN8oxWD57w3QwiBervwiyzdxr5HvIgKJ7djBueDcXhLIBCwZqjNrOIdIwYvC7KUBoCV315P2/Z/GHi7PRiw7HctpAjf83nkeNROOFBk+MO/iGLyOflOFEDFl/ipk+0UvowSp7drSZH4Zb/YZ2c4qJuHxzHOq6R/l9RG9m3aA5RYIRBfflNKVwQKBgQDOD+VRq6kpFwmACnEdlXdTmONpWUvCe9o4dd5dT56AdFfjklhcfNpaIAj+SRxcdVauHi1vWWvswPvC4bQa74tHikzLotlISNGxs6pOvDzOX6QTPhzF1I02cL9a5RyY1bsNOJVlhVmxhKHQYIjo163AXEBea+i5y9KUram1OWbUQQKBgQC9ukyzULSw58R4QvJMBjdvqA+DHJShNBVumfTSCcLtI4D0Vd3Z9boYDe1bCr0JzExnmRQove9dl5CVoggk7GnkWyGMbV/ZEkyvS4KivVNAF0RjGN3WfZkftInhLFJotOKdHjSuCB4h1XN2ir9eS/Ut789ZqcwgHQEygWP2yZ7neQKBgAlhEdgIzzdOlCEe2I03K2pDsD4wUVF137XoL4nhwN4p7YIvPBRhnnKxuJcSbtcKhDqCpyDFWjM5iXwSV+dN9fH4qowuSmOO5PSIr/zLdp0SH1682gRrK05KDXuuqAGQ4OW2KJ6pVi7NUawxaKnof0EdMdTaZopma5xW1z2ncjXBAoGADVoC88uGK7zjsqLjcj4twInPLabhPsbviy0CcZWGRjHtbURtrF0Cj5bLUVDcJMhfyBqZtJRJOAjmf+E7OX35pbxUDBHWYOxMwTlLJDC2nxgEFAU391Q3ZmfKHDKGSiAQooXxpx2jITZoPbtd5EDsLCNoMCMm3kusPeWlJ0ThDeECgYBv15WilEknnWDyObaBwfgzuhdJ6jk1TcaIoND8xhI/3RbMnd0B4rTQmdZIQYwvjIuKgbcgi0i8M+Bem+idH8aoCD6E0abxUp0+jpHgK//UqBlVqprszrNf2MHgSyzXZ82fj4JMBwh7iudv5ZVqEngNUWVQzlmFJ/9WUOfdk23Pgg==-----END PRIVATE KEY-----";

qz.security.setSignatureAlgorithm("SHA512"); // Since 2.1
qz.security.setSignaturePromise(function (toSign) {
  return function (resolve, reject) {
    try {
      var pk = KEYUTIL.getKey(privateKey);
      var sig = new KJUR.crypto.Signature({ alg: "SHA512withRSA" }); // Use "SHA1withRSA" for QZ Tray 2.0 and older
      sig.init(pk);
      sig.updateString(toSign);
      var hex = sig.sign();
      console.log("DEBUG: \n\n" + stob64(hextorstr(hex)));
      resolve(stob64(hextorstr(hex)));
    } catch (err) {
      console.error(err);
      reject(err);
    }
  };
});
