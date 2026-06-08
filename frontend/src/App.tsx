import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import DatasetExplorer from './DatasetExplorer';
import TalkToData from './TalkToData';
import Methodology from './Methodology';
import Analytics from './Analytics';
import MapView from './MapView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dataset-explorer" element={<DatasetExplorer />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/talk-to-data" element={<TalkToData />} />
        <Route path="/methodology" element={<Methodology />} />
      </Routes>
    </BrowserRouter>
  );
}
