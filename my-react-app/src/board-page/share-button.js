import React, { useState } from "react";
import { ShareAltOutlined } from "@ant-design/icons";
import { useLocation, useHref } from "react-router-dom";
import { Button, Input, Modal, QRCode } from "antd";

const getShareUrl = (peerId) => {
  const location = useLocation();

  // Use useHref to generate a URL that respects the basename
  const params = new URLSearchParams(location.search);

  // Add or update the hostId query parameter
  params.set("hostId", peerId);

  // Use useHref to generate the correct URL with the basename
  const newUrl = useHref({
    pathname: location.pathname,
    search: `?${params.toString()}`,
  });

  return `${window.location.origin}${newUrl}`; // Generate the full absolute URL
};

export const ShareBoardButton = ({ peerId, hostId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  // If hostId is defined, the current connection is connected to a host.
  // If its not defined we use the current peerId which others can use to make the current session a host.
  const shareUrl = getShareUrl(hostId || peerId);

  return (
    <>
      <Button type="default" onClick={showModal} icon={<ShareAltOutlined />} />
      <Modal title="Share Session" style={{ top: 20 }} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        {/* Display the shareable URL */}
        <Input value={shareUrl} readOnly />

        {/* Center and adjust the QR code size */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          {/* Increase QR code size to 200px */}
          <QRCode value={shareUrl} size={200} />
        </div>
      </Modal>
    </>
  );
};
