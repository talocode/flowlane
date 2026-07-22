import json
import os
import requests
from typing import Optional, Dict, Any, List

class FlowLane:
    def __init__(self, base_url: str = "https://api.talocode.site", api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key or os.environ.get("TALOCODE_API_KEY")
    
    def _request(self, path: str, method: str = "GET", data: Optional[Dict] = None) -> Dict:
        url = f"{self.base_url}{path}"
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        response.raise_for_status()
        return response.json()
    
    def create_workflow(self, name: str, nodes: List[Dict] = None, edges: List[Dict] = None) -> Dict:
        return self._request("/v1/flowlane/workflows", "POST", {
            "name": name,
            "nodes": nodes or [],
            "edges": edges or []
        })
    
    def generate_skill(self, workflow: Dict, format: str = "claude") -> Dict:
        return self._request("/v1/flowlane/generate", "POST", {
            "workflow": workflow,
            "format": format
        })
    
    def validate_workflow(self, workflow: Dict) -> Dict:
        return self._request("/v1/flowlane/validate", "POST", workflow)
    
    def list_templates(self) -> Dict:
        return self._request("/v1/flowlane/templates")
    
    def health(self) -> Dict:
        return self._request("/v1/flowlane/health")
