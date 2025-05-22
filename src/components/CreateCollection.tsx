import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ChevronDown, ChevronUp, File, Link2, Database, Trash2, Settings, Eye, Plus, Server, Loader, FolderPlus } from "lucide-react";
import TopBar from "./TopBar";
import "./CreateCollections.css";

interface Database {
  name: string;
  host?: string;
  password?: string;
  access_key?: string;
  secret_key?: string;
}

interface Collection {
  files: string[];
  url: string[];
  databases: Database[];
}

interface Collections {
  [key: string]: Collection;
}

// Demo data to use if API call fails
const demoCollections: Collections = {
  "Research Project": {
    files: ["dataset.csv", "analysis.pdf", "notes.docx", "results.xlsx"],
    url: ["https://www.researchgate.net/papers", "https://scholar.google.com"],
    databases: [
      { name: "PostgreSQL", host: "db.research.local", password: "••••••••" },
      { name: "AWS S3", access_key: "AKIAXXXXXXXX", secret_key: "••••••••" }
    ]
  },
  "Marketing Content": {
    files: ["branding_guide.pdf", "logo.png", "presentation.pptx"],
    url: ["https://www.behance.net/gallery", "https://dribbble.com/shots"],
    databases: [
      { name: "MySQL", host: "marketing-db.cloud", password: "••••••••" }
    ]
  },
  "Financial Data": {
    files: ["q1_report.pdf", "expenses.csv", "revenue.xlsx"],
    url: ["https://finance.yahoo.com", "https://www.bloomberg.com/markets"],
    databases: [
      { name: "MongoDB", host: "finance.mongo.cloud", password: "••••••••" },
      { name: "AWS RDS", access_key: "AKIAXXXXXXXX", secret_key: "••••••••" }
    ]
  }
};

export default function CreateCollection() {
  const { getToken } = useAuth();
  const [collections, setCollections] = useState<Collections>({});
  const [expandedCollections, setExpandedCollections] = useState<string[]>([]);
  const [newLink, setNewLink] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDatabaseVisible, setNewDatabaseVisible] = useState<{[key: string]: boolean}>({});
  const [selectedDbType, setSelectedDbType] = useState<{[key: string]: string}>({});
  const [dbConfig, setDbConfig] = useState<{[key: string]: any}>({});
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      
      // In a real environment, we would call the API
      // For now, simulate API failure and use demo data
      try {
        const response = await fetch("https://backend.sigmoyd.in/get_collections", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.collections) {
          setCollections(data.collections);
        } else {
          // Use demo data if API returns empty or malformatted data
          setCollections(demoCollections);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
        // Use demo data if API call fails
        console.log("Using demo data as fallback");
        setCollections(demoCollections);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Failed to authenticate. Please try again later.");
      setCollections({}); // Set empty collections on auth error
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (collectionId: string, files: FileList) => {
    setLoading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));
      
      // In a real environment, we would call the API
      // For demo, simulate API call and update local state
      console.log(`Uploading files to collection: ${collectionId}`);
      
      // Update local state to simulate successful upload
      const updatedCollections = { ...collections };
      if (updatedCollections[collectionId]) {
        const newFileNames = Array.from(files).map(file => file.name);
        updatedCollections[collectionId].files = [
          ...updatedCollections[collectionId].files,
          ...newFileNames
        ];
        setCollections(updatedCollections);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("Failed to upload files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (collectionId: string, filename: string) => {
    try {
      const token = await getToken();
      // For demo purposes, just alert the filename
      alert(`Viewing file: ${filename} from collection: ${collectionId}`);
    } catch (error) {
      console.error("Error viewing file:", error);
      setError("Failed to view file. Please try again.");
    }
  };

  const handleDeleteFile = async (collectionId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    
    setLoading(true);
    try {
      // In a real environment, we would call the API
      // For demo, simulate API call and update local state
      console.log(`Deleting file: ${filename} from collection: ${collectionId}`);
      
      // Update local state to simulate successful deletion
      const updatedCollections = { ...collections };
      if (updatedCollections[collectionId]) {
        updatedCollections[collectionId].files = updatedCollections[collectionId].files.filter(
          file => file !== filename
        );
        setCollections(updatedCollections);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      setError("Failed to delete file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (collectionId: string) => {
    if (!newLink[collectionId]?.trim()) return;
    
    setLoading(true);
    try {
      // In a real environment, we would call the API
      // For demo, simulate API call and update local state
      console.log(`Adding link: ${newLink[collectionId]} to collection: ${collectionId}`);
      
      // Update local state to simulate successful addition
      const updatedCollections = { ...collections };
      if (updatedCollections[collectionId]) {
        updatedCollections[collectionId].url = [
          ...updatedCollections[collectionId].url,
          newLink[collectionId]
        ];
        setCollections(updatedCollections);
        setNewLink({ ...newLink, [collectionId]: '' });
      }
    } catch (error) {
      console.error("Error adding link:", error);
      setError("Failed to add link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (collectionId: string, url: string) => {
    if (!confirm(`Are you sure you want to delete ${url}?`)) return;
    
    setLoading(true);
    try {
      // In a real environment, we would call the API
      // For demo, simulate API call and update local state
      console.log(`Deleting link: ${url} from collection: ${collectionId}`);
      
      // Update local state to simulate successful deletion
      const updatedCollections = { ...collections };
      if (updatedCollections[collectionId]) {
        updatedCollections[collectionId].url = updatedCollections[collectionId].url.filter(
          u => u !== url
        );
        setCollections(updatedCollections);
      }
    } catch (error) {
      console.error("Error deleting link:", error);
      setError("Failed to delete link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDatabase = (collectionId: string) => {
    const dbType = selectedDbType[collectionId] || "postgres";
    const config = dbConfig[collectionId] || {};
    
    // In a real environment, we would call the API
    // For demo, simulate API call and update local state
    console.log(`Adding ${dbType} database to collection: ${collectionId}`, config);
    
    // Create a friendly name based on the database type
    let dbName = "";
    if (dbType === "postgres") dbName = "PostgreSQL";
    else if (dbType === "mysql") dbName = "MySQL";
    else if (dbType === "mongodb") dbName = "MongoDB";
    else if (dbType === "aws") dbName = "AWS RDS";
    else if (dbType === "gcp") dbName = "Google Cloud SQL";
    
    // Update local state to simulate successful addition
    const updatedCollections = { ...collections };
    if (updatedCollections[collectionId]) {
      const newDatabase: Database = {
        name: dbName,
        ...config
      };
      
      updatedCollections[collectionId].databases = [
        ...updatedCollections[collectionId].databases,
        newDatabase
      ];
      
      setCollections(updatedCollections);
      setNewDatabaseVisible({...newDatabaseVisible, [collectionId]: false});
    }
  };

  const showDatabaseForm = (collectionId: string) => {
    setNewDatabaseVisible({...newDatabaseVisible, [collectionId]: true});
    setSelectedDbType({...selectedDbType, [collectionId]: "postgres"});
    setDbConfig({...dbConfig, [collectionId]: {}});
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    
    // Create a new collection with empty arrays
    const updatedCollections = { ...collections };
    updatedCollections[newCollectionName] = {
      files: [],
      url: [],
      databases: []
    };
    
    setCollections(updatedCollections);
    setNewCollectionName("");
    setShowNewCollectionForm(false);
    
    // Auto-expand the newly created collection
    setExpandedCollections([...expandedCollections, newCollectionName]);
  };

  const DatabaseForm = ({collectionId}: {collectionId: string}) => {
    const dbType = selectedDbType[collectionId] || "postgres";
    
    return (
      <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-[0_0_10px_rgba(0,0,0,0.3)]">
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Database Type</label>
          <select 
            value={dbType}
            onChange={(e) => setSelectedDbType({...selectedDbType, [collectionId]: e.target.value})}
            className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mongodb">MongoDB</option>
            <option value="aws">AWS</option>
            <option value="gcp">Google Cloud</option>
          </select>
        </div>
        
        {/* Dynamic form fields based on database type */}
        {dbType === "postgres" || dbType === "mysql" ? (
          <div className="space-y-3">
            <div>
              <label className="block text-gray-300 mb-1">Host</label>
              <input 
                type="text" 
                placeholder="localhost"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDbConfig({...dbConfig, [collectionId]: {...dbConfig[collectionId], host: e.target.value}})}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Port</label>
              <input 
                type="text" 
                placeholder={dbType === "postgres" ? "5432" : "3306"}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDbConfig({...dbConfig, [collectionId]: {...dbConfig[collectionId], port: e.target.value}})}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Database Name</label>
              <input 
                type="text" 
                placeholder="my_database"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDbConfig({...dbConfig, [collectionId]: {...dbConfig[collectionId], dbname: e.target.value}})}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Username</label>
              <input 
                type="text" 
                placeholder="username"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDbConfig({...dbConfig, [collectionId]: {...dbConfig[collectionId], username: e.target.value}})}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDbConfig({...dbConfig, [collectionId]: {...dbConfig[collectionId], password: e.target.value}})}
              />
            </div>
          </div>
        ) : dbType === "mongodb" ? (
          <div className="space-y-3">
            <div>
              <label className="block text-gray-300 mb-1">Connection String</label>
              <input 
                type="text" 
                placeholder="mongodb://localhost:27017/mydb"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDbConfig({...dbConfig, [collectionId]: {...dbConfig[collectionId], uri: e.target.value}})}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-gray-300 mb-1">Access Key</label>
              <input 
                type="text" 
                placeholder="AKIAXXXXXXXXXXXXXXXX"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDbConfig({...dbConfig, [collectionId]: {...dbConfig[collectionId], access_key: e.target.value}})}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Secret Key</label>
              <input 
                type="password" 
                placeholder="••••••••••••••••••••••••••"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDbConfig({...dbConfig, [collectionId]: {...dbConfig[collectionId], secret_key: e.target.value}})}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Region</label>
              <input 
                type="text" 
                placeholder="us-east-1"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDbConfig({...dbConfig, [collectionId]: {...dbConfig[collectionId], region: e.target.value}})}
              />
            </div>
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <button 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center gap-2"
            onClick={() => handleAddDatabase(collectionId)}
          >
            <Plus size={16} /> Add Database
          </button>
          <button 
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-all duration-300"
            onClick={() => setNewDatabaseVisible({...newDatabaseVisible, [collectionId]: false})}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-grey bg-[radial-gradient(circle_at_top,_rgba(0,173,181,0.1),_rgba(0,0,0,0)_50%)]">
      <TopBar onMenuClick={() => {}} sidebarVisible={false} />
      
      <div className="p-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Your Collections</h1>
              <p className="text-gray-400">Manage your files, links, and database connections</p>
            </div>
            
            <button 
              onClick={() => setShowNewCollectionForm(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] flex items-center gap-2"
            >
              <FolderPlus size={18} /> Create Collection
            </button>
          </div>
          
          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {showNewCollectionForm && (
            <div className="mb-8 p-5 bg-gray-900 bg-opacity-60 rounded-xl border border-gray-800 shadow-lg">
              <h3 className="text-xl font-medium text-white mb-4">Create New Collection</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                  className="flex-1 bg-gray-800 bg-opacity-70 text-white px-4 py-2 rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewCollectionForm(false);
                    setNewCollectionName("");
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <Loader size={40} className="text-blue-500 animate-spin mb-4" />
                <p className="text-gray-400">Loading your collections...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(collections).length > 0 ? (
                Object.entries(collections).map(([collectionId, collection]) => (
                  <div key={collectionId} className="collection-card">
                    <button
                      className="w-full flex justify-between items-center text-white py-2"
                      onClick={() => setExpandedCollections(prev => 
                        prev.includes(collectionId) 
                          ? prev.filter(id => id !== collectionId)
                          : [...prev, collectionId]
                      )}
                    >
                      <span className="text-2xl font-semibold bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                        {collectionId}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <File size={14} className="opacity-70" /> {collection.files.length}
                          <span className="ml-2"><Link2 size={14} className="opacity-70" /> {collection.url.length}</span>
                          <span className="ml-2"><Database size={14} className="opacity-70" /> {collection.databases.length}</span>
                        </div>
                        <div className="bg-gray-800 rounded-full p-1 ml-2">
                          {expandedCollections.includes(collectionId) ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </div>
                    </button>

                    {expandedCollections.includes(collectionId) && (
                      <div className="space-y-6 mt-4">
                        {/* Files Section */}
                        <div className="border-t border-gray-800 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                              <File size={20} className="text-blue-400" /> Files & Documents
                            </h3>
                            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center gap-2 upload-btn">
                              <Plus size={16} /> Upload Files
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => e.target.files && handleFileUpload(collectionId, e.target.files)}
                              />
                            </label>
                          </div>
                          <div className="space-y-2">
                            {collection.files.length > 0 ? (
                              collection.files.map(file => (
                                <div key={file} className="flex items-center justify-between bg-gray-800 bg-opacity-50 p-3 rounded-lg hover:bg-opacity-70 transition-colors file-item">
                                  <span className="text-gray-300">{file}</span>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => handleViewFile(collectionId, file)}
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900 hover:bg-opacity-30 p-2 rounded-full transition-all"
                                      title="View file"
                                    >
                                      <Eye size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(collectionId, file)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 p-2 rounded-full transition-all"
                                      title="Delete file"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-gray-500 bg-gray-800 bg-opacity-20 rounded-lg">
                                <p>No files uploaded yet</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* URLs Section */}
                        <div className="border-t border-gray-800 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                              <Link2 size={20} className="text-green-400" /> URLs & Links
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {collection.url.length > 0 ? (
                              collection.url.map(url => (
                                <div key={url} className="flex items-center justify-between bg-gray-800 bg-opacity-50 p-3 rounded-lg hover:bg-opacity-70 transition-colors link-item">
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline overflow-hidden text-ellipsis">{url}</a>
                                  <button
                                    onClick={() => handleDeleteLink(collectionId, url)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 p-2 rounded-full transition-all ml-2"
                                    title="Delete link"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-500 bg-gray-800 bg-opacity-20 rounded-lg mb-4">
                                <p>No links added yet</p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-4">
                              <input
                                type="text"
                                value={newLink[collectionId] || ''}
                                onChange={(e) => setNewLink({ ...newLink, [collectionId]: e.target.value })}
                                placeholder="Enter URL (e.g., https://example.com)"
                                className="flex-1 bg-gray-800 bg-opacity-50 text-white px-4 py-2 rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddLink(collectionId)}
                              />
                              <button
                                onClick={() => handleAddLink(collectionId)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center gap-2 add-link-btn"
                                disabled={!newLink[collectionId]?.trim()}
                              >
                                <Plus size={18} /> Add URL
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Databases Section */}
                        <div className="border-t border-gray-800 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                              <Database size={20} className="text-purple-400" /> Databases
                            </h3>
                            <button
                              onClick={() => showDatabaseForm(collectionId)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center gap-2 connect-db-btn"
                            >
                              <Plus size={18} /> Connect Database
                            </button>
                          </div>
                          <div className="space-y-3">
                            {collection.databases.length > 0 ? (
                              collection.databases.map((db, index) => (
                                <div key={index} className="bg-gray-800 bg-opacity-50 p-3 rounded-lg hover:bg-opacity-70 transition-colors database-item">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Server size={18} className="text-purple-400" />
                                      <span className="text-gray-300 font-medium">{db.name}</span>
                                    </div>
                                    <button className="text-blue-400 hover:text-blue-300 hover:bg-blue-900 hover:bg-opacity-30 p-2 rounded-full transition-all">
                                      <Settings size={18} />
                                    </button>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-500">
                                    {db.host && <div>Host: {db.host}</div>}
                                    {db.access_key && <div>Access Key: {db.access_key.substring(0, 4)}...{db.access_key.substring(db.access_key.length - 4)}</div>}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-gray-500 bg-gray-800 bg-opacity-20 rounded-lg">
                                <p>No databases connected yet</p>
                              </div>
                            )}
                          </div>
                          
                          {newDatabaseVisible[collectionId] && <DatabaseForm collectionId={collectionId} />}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-gray-400 empty-state">
                  <Database size={60} className="mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-medium mb-2">No collections found</h3>
                  <p className="mb-6">Start by creating a new collection to organize your resources</p>
                  <button 
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                    onClick={() => setShowNewCollectionForm(true)}
                  >
                    Create New Collection
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
