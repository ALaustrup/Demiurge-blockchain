#ifndef RPC_H
#define RPC_H

#include <string>

std::string callRpc(const char* url, const std::string& method, const std::string& params);

#endif

